import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import webpush from 'npm:web-push@3.6.7';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY')!;

const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')?.trim() || "";
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')?.trim() || "";
const subject = 'mailto:admin@elprogreso.com';

console.log("Check Alerts Function Started");
console.log("VAPID Pub:", vapidPublicKey.substring(0, 4) + "..." + vapidPublicKey.substring(vapidPublicKey.length - 4));
console.log("VAPID Priv:", vapidPrivateKey.substring(0, 4) + "..." + vapidPrivateKey.substring(vapidPrivateKey.length - 4));

Deno.serve(async (req) => {
    try {
        if (!vapidPublicKey || !vapidPrivateKey) {
            throw new Error("Missing or empty VAPID keys");
        }

        console.log("Configuring VAPID...");
        webpush.setVapidDetails(subject, vapidPublicKey, vapidPrivateKey);
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Obtener vehículos
        console.log("Fetching vehicles...");
        const { data: vehicles, error: vehiclesError } = await supabase
            .from('vehiculos')
            .select('*');

        if (vehiclesError) {
            console.error("Vehicles Error:", vehiclesError);
            throw vehiclesError;
        }

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
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
                }
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
        let successfulSends = 0;
        const results = [];
        const plainTextMessage = alerts.length === 1
            ? `${alerts[0].type} de ${alerts[0].vehicle} vence en ${alerts[0].days} días.`
            : `Tienes ${alerts.length} vencimientos próximos de flota.`;

        for (const subRecord of subscriptions) {
            try {
                await webpush.sendNotification(subRecord.subscription, plainTextMessage);
                successfulSends++;
                results.push({ success: true, id: subRecord.id });
            } catch (error: any) {
                console.error(`Error sending to sub ${subRecord.id}:`, error.message || error);
                if (error.statusCode === 410 || error.statusCode === 404) {
                    await supabase.from('push_subscriptions').delete().eq('id', subRecord.id);
                }
                results.push({ success: false, id: subRecord.id, error: error.message || error });
            }
        }

        return new Response(JSON.stringify({ sent: successfulSends, totalSubs: subscriptions.length, alertsCount: alerts.length, details: alerts }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});
