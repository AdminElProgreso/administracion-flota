import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import webpush from 'npm:web-push@3.6.7';
import { AR_TIME_ZONE, todayISO } from '../_shared/dates.ts';
import { planDeliveries, sendAll } from '../_shared/notifications.ts';
import { CORS_HEADERS, requestAction } from '../_shared/http.ts';

const JSON_HEADERS = { ...CORS_HEADERS, 'Content-Type': 'application/json' };

// Undelivered pushes expire after 20 hours: the next morning's run sends a fresh one anyway
const PUSH_TTL_SECONDS = 72000;

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY')!;

const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')?.trim() || "";
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')?.trim() || "";
const subject = 'mailto:admin@elprogreso.com';

console.log("Check Alerts Function Started (Shared Rules v3)");

Deno.serve(async (req) => {
    // La consulta previa del navegador llega sin credenciales: nunca dispara el envío
    const action = requestAction(req.method);
    if (action === 'preflight') return new Response(null, { status: 204, headers: CORS_HEADERS });
    if (action === 'reject') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: JSON_HEADERS });

    try {
        if (!vapidPublicKey || !vapidPrivateKey) throw new Error("Missing VAPID keys");

        webpush.setVapidDetails(subject, vapidPublicKey, vapidPrivateKey);
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Obtener Datos Base (las unidades de baja las saltea planDeliveries; un filtro SQL dejaría afuera los status nulos)
        const [vehiclesRes, subscriptionsRes, settingsRes] = await Promise.all([
            supabase.from('vehiculos').select('*'),
            supabase.from('push_subscriptions').select('id, user_id, subscription'),
            // Ascendente: la fila más nueva de cada usuario queda última y gana
            supabase.from('user_settings').select('*').order('updated_at', { ascending: true }),
        ]);
        if (vehiclesRes.error) throw vehiclesRes.error;
        if (subscriptionsRes.error) throw subscriptionsRes.error;
        if (settingsRes.error) throw settingsRes.error;

        // 2. Avisos de hoy (fecha de Argentina) para cada dispositivo, con los ajustes de su usuario
        const today = todayISO(new Date(), AR_TIME_ZONE);
        const deliveries = planDeliveries(vehiclesRes.data ?? [], subscriptionsRes.data ?? [], settingsRes.data ?? [], today);

        // 3. Enviar todo en paralelo, dejando registro de cada falla
        const result = await sendAll(deliveries, (subscription, payload) =>
            webpush.sendNotification(subscription as any, payload, { TTL: PUSH_TTL_SECONDS }).catch((error: any) => {
                console.error(`Push failed (${error.statusCode ?? 'no status'}):`, error.body || error.message);
                throw error;
            })
        );

        // 4. Borrar los dispositivos que ya no existen
        if (result.expiredSubscriptionIds.length > 0) {
            const { error } = await supabase.from('push_subscriptions').delete().in('id', result.expiredSubscriptionIds);
            if (error) console.error('Error removing expired subscriptions:', error.message);
        }

        return new Response(JSON.stringify({
            today,
            deliveries: deliveries.length,
            sent: result.sent,
            failed: result.failed,
            removedSubscriptions: result.expiredSubscriptionIds.length,
        }), {
            headers: JSON_HEADERS
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: JSON_HEADERS });
    }
});
