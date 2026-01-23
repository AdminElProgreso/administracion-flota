import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import webpush from 'npm:web-push@3.6.7';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY')!;

const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')?.trim() || "";
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')?.trim() || "";
const subject = 'mailto:admin@elprogreso.com';

console.log("Check Alerts Function Started (Personalized Mode v2)");

Deno.serve(async (req) => {
    try {
        if (!vapidPublicKey || !vapidPrivateKey) throw new Error("Missing VAPID keys");

        webpush.setVapidDetails(subject, vapidPublicKey, vapidPrivateKey);
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Obtener Datos Base
        const { data: vehicles } = await supabase.from('vehiculos').select('*');
        const { data: subscriptions } = await supabase.from('push_subscriptions').select('*');
        const { data: userSettings } = await supabase.from('user_settings').select('*');

        if (!vehicles || !subscriptions) return new Response(JSON.stringify({ message: "No vehicles or subs" }));

        // 2. Crear mapa de ajustes por usuario
        const settingsMap = new Map();
        userSettings?.forEach(s => settingsMap.set(s.user_id, s));

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let totalSent = 0;

        // 3. Procesar CADA suscripción de forma personalizada
        for (const subRecord of subscriptions) {
            const userId = subRecord.user_id;
            const settings = settingsMap.get(userId) || {
                vtv_threshold: 30,
                insurance_threshold: 15,
                patente_threshold: 10,
                appointments_threshold: 3
            };

            // Filtrar alertas para ESTE usuario según SUS umbrales
            const userAlerts: any[] = [];
            vehicles.forEach(v => {
                // Función genérica para vencimientos
                const checkExpiry = (dateStr: string | null, type: string, threshold: number) => {
                    if (!dateStr) return;
                    const diff = new Date(dateStr).getTime() - today.getTime();
                    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                    if (days <= threshold && days >= 0) {
                        userAlerts.push({ id: v.id, type, vehicle: v.model, patente: v.patente, days });
                    }
                };

                // Función genérica para turnos (Appointments)
                const checkAppt = (dateStr: string | null, type: string) => {
                    if (!dateStr) return;
                    const diff = new Date(dateStr).getTime() - today.getTime();
                    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                    const threshold = settings.appointments_threshold || 3;
                    if (days <= threshold && days >= 0) {
                        userAlerts.push({
                            id: v.id,
                            type: `Turno ${type}`,
                            vehicle: v.model,
                            patente: v.patente,
                            days,
                            isAppt: true
                        });
                    }
                };

                // Vencimientos
                checkExpiry(v.vtv_expiration, 'VTV', settings.vtv_threshold);
                checkExpiry(v.insurance_expiration, 'Seguro', settings.insurance_threshold);
                checkExpiry(v.patente_expiration, 'Patente', settings.patente_threshold);

                // Turnos
                checkAppt(v.vtv_appointment, 'VTV');
                checkAppt(v.insurance_appointment, 'Seguro');
                checkAppt(v.patente_appointment, 'Patente');
            });

            // 4. Si hay alertas para este usuario, enviar notificación
            if (userAlerts.length > 0) {
                const payload = JSON.stringify({
                    title: userAlerts.length === 1 ? '⚠️ Alerta de Flota' : '⚠️ Alertas de Flota',
                    body: userAlerts.length === 1
                        ? `${userAlerts[0].type} de ${userAlerts[0].vehicle} (${userAlerts[0].patente}) en ${userAlerts[0].days} días.`
                        : `Tienes ${userAlerts.length} avisos próximos en tu flota.`,
                    url: userAlerts.length === 1 ? `/#/fleet/${userAlerts[0].id}` : '/#/fleet',
                    tag: 'fleet-alert'
                });

                try {
                    await webpush.sendNotification(subRecord.subscription, payload);
                    totalSent++;
                } catch (error: any) {
                    console.error(`Error sending to device ${subRecord.id}:`, error.message);
                    if (error.statusCode === 410 || error.statusCode === 404) {
                        await supabase.from('push_subscriptions').delete().eq('id', subRecord.id);
                    }
                }
            }
        }

        return new Response(JSON.stringify({ sent: totalSent, processed: subscriptions.length }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});
