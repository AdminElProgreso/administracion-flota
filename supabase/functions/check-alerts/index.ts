import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import webpush from 'npm:web-push@3.6.7';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY')!;

const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')?.trim() || "";
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')?.trim() || "";
const subject = 'mailto:admin@elprogreso.com';

console.log("Check Alerts Function Started (Personalized Mode)");

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
        let totalSent = 0;

        // 3. Procesar CADA suscripción de forma personalizada
        for (const subRecord of subscriptions) {
            const userId = subRecord.user_id;
            const settings = settingsMap.get(userId) || {
                vtv_threshold: 30,
                insurance_threshold: 15,
                patente_threshold: 10
            };

            // Filtrar alertas para ESTE usuario según SUS umbrales
            const userAlerts: any[] = [];
            vehicles.forEach(v => {
                const check = (dateStr: string | null, type: string, threshold: number) => {
                    if (!dateStr) return;
                    const days = Math.ceil((new Date(dateStr).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    if (days <= threshold && days >= 0) {
                        userAlerts.push({ id: v.id, type, vehicle: v.model, patente: v.patente, days });
                    }
                };

                check(v.vtv_expiration, 'VTV', settings.vtv_threshold);
                check(v.insurance_expiration, 'Seguro', settings.insurance_threshold);
                check(v.patente_expiration, 'Patente', settings.patente_threshold);
            });

            // 4. Si hay alertas para este usuario, enviar notificación
            if (userAlerts.length > 0) {
                const payload = JSON.stringify({
                    title: userAlerts.length === 1 ? '⚠️ Vencimiento Próximo' : '⚠️ Alertas de Flota',
                    body: userAlerts.length === 1
                        ? `${userAlerts[0].type} de ${userAlerts[0].vehicle} (${userAlerts[0].patente}) vence en ${userAlerts[0].days} días.`
                        : `Tienes ${userAlerts.length} vencimientos próximos en tu flota.`,
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
