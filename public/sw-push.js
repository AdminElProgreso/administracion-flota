// Custom Push Notification Logic - Premium Version
// Imported into the main sw.js by VitePWA

self.addEventListener('push', (event) => {
    console.log('[SW-Push] Received rich payload');

    let data = {
        title: 'Gestión El Progreso',
        body: 'Tienes una nueva alerta de flota.',
        url: '/fleet',
        tag: 'fleet-alert-unique'
    };

    if (event.data) {
        try {
            // Intentamos parsear el JSON que ahora manda el servidor
            const json = event.data.json();
            data = { ...data, ...json };
        } catch (e) {
            // Si falla el JSON (ej: texto plano), lo usamos como body
            data.body = event.data.text();
            console.warn('[SW-Push] Payload was not JSON, using as text');
        }
    }

    const notificationOptions = {
        body: data.body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: data.tag,
        renotify: true,
        vibrate: [200, 100, 200, 100, 200],
        data: {
            url: data.url
        },
        actions: [
            { action: 'open', title: 'Abrir App' },
            { action: 'close', title: 'Ignorar' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, notificationOptions)
    );
});

self.addEventListener('notificationclick', (event) => {
    const notification = event.notification;
    const action = event.action;
    const targetUrl = notification.data.url || '/';

    notification.close();

    if (action === 'close') {
        return; // No hacer nada si el usuario tocó "Ignorar"
    }

    // Lógica para abrir la App o enfocar si ya está abierta
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Si hay una pestaña abierta, enfocarla
            for (let client of windowClients) {
                if (client.url.includes(targetUrl) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Si no, abrir una nueva
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
