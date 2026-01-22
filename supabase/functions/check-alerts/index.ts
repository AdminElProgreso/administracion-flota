import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import webpush from 'https://esm.sh/web-push@3.6.7';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// VAPID keys should be set in your remote Supabase secrets
// supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=...
const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')!;
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!;
const subject = 'mailto:admin@elprogreso.com';

webpush.setVapidDetails(subject, vapidPublicKey, vapidPrivateKey);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
    try {
        // 1. Obtener vehículos
        const { data: vehicles, error: vehiclesError } = await supabase
            .from('vehicles')
            .select('*');

        if (vehiclesError) throw vehiclesError;

        // 2. Identificar Alertas (Usando umbrales por defecto por ahora)
        const alerts: any[] = [];
        const today = new Date();

        // Umbrales por defecto (Días)
        const THRESHOLDS = {
            vtv: 30,
            insurance: 15,
            patente: 10
        };

        vehicles.forEach((vehicle: any) => {
            const checkExpiration = (dateStr: string | null, type: string, threshold: number) => {
                if (!dateStr) return;
                const diffTime = new Date(dateStr).getTime() - today.getTime();
                const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (days <= threshold && days >= 0) {
                    alerts.push({
                        type,
                        vehicle: vehicle.model,
                        patente: vehicle.patente,
                        days
                    });
                }
            };

            checkExpiration(vehicle.vtv_expiration, 'VTV', THRESHOLDS.vtv);
            checkExpiration(vehicle.insurance_expiration, 'Seguro', THRESHOLDS.insurance);
            checkExpiration(vehicle.patente_expiration, 'Patente', THRESHOLDS.patente);
        });

        if (alerts.length === 0) {
            return new Response(JSON.stringify({ message: 'No active alerts found' }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 3. Crear mensaje resumido
        // Para simplificar, enviamos una alerta genérica si hay muchas, o específica si es una.
        const title = '⚠️ Alertas de Flota';
        let body = '';

        if (alerts.length === 1) {
            body = `${alerts[0].type} de ${alerts[0].vehicle} vence en ${alerts[0].days} días.`;
        } else {
            body = `Tienes ${alerts.length} vencimientos próximos (VTV, Seguros, etc.).`;
        }

        // 4. Obtener Suscripciones
        const { data: subscriptions, error: subsError } = await supabase
            .from('push_subscriptions')
            .select('*');

        if (subsError) throw subsError;

        // 5. Enviar Notificaciones
        const results = [];
        for (const subRecord of subscriptions) {
            // Podríamos filtrar aquí por preferencias de usuario si las guardáramos en la DB
            const payload = JSON.stringify({
                title,
                body,
                url: '/', // Abrir la app
                tag: 'alerts-check' // Reemplazar notificaciones viejas con el mismo tag
            });

            try {
                await webpush.sendNotification(subRecord.subscription, payload);
                results.push({ success: true, id: subRecord.id });
            } catch (error) {
                console.error('Error sending to sub', subRecord.id, error);
                if (error.statusCode === 410 || error.statusCode === 404) {
                    // Suscripción inválida, eliminar
                    await supabase.from('push_subscriptions').delete().eq('id', subRecord.id);
                }
                results.push({ success: false, id: subRecord.id, error });
            }
        }

        return new Response(JSON.stringify({ sent: results.length, alertsCount: alerts.length, details: alerts }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});
