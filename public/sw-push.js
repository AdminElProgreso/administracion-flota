// Custom Push Notification Logic - Premium Version v2.1
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
            const json = event.data.json();
            data = { ...data, ...json };
        } catch (e) {
            data.body = event.data.text();
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

    // Resolvemos la URL absoluta para evitar errores en navegadores
    const targetUrl = new URL(notification.data.url || '/', self.location.origin).href;

    notification.close();

    if (action === 'close') {
        return;
    }

    // Intentar encontrar una ventana abierta de nuestra App
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // 1. Intentar encontrar la pestaña exacta
            for (let client of windowClients) {
                if (client.url === targetUrl && 'focus' in client) {
                    return client.focus();
                }
            }
            // 2. Si no está la exacta, enfocar cualquier pestaña de la App
            for (let client of windowClients) {
                if ('focus' in client) {
                    client.navigate(targetUrl); // Cambiamos la URL de la pestaña abierta a Flota
                    return client.focus();
                }
            }
            // 3. Si no hay nada abierto, abrir nueva ventana
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
