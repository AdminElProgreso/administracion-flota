// Custom Push Notification Logic - Mobile Navigation Fix v3.0
// Imported into the main sw.js by VitePWA

self.addEventListener('push', (event) => {
    console.log('[SW-Push] Rich signal received');

    let data = {
        title: 'Gestión El Progreso',
        body: 'Tienes una nueva alerta de flota.',
        url: '/fleet', // Ruta por defecto
        tag: 'fleet-alert-unique'
    };

    if (event.data) {
        try {
            const json = event.data.json();
            data = { ...data, ...json };
        } catch (e) {
            data.body = event.data.text();
            console.warn('[SW-Push] Data was not JSON');
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
    event.notification.close();

    if (event.action === 'close') return;

    // Construir URL absoluta de forma ultra-segura para móvil
    const targetUrl = new URL(event.notification.data.url || '/', self.location.origin).href;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((windowClients) => {
                // 1. Intentar encontrar UNA pestaña abierta de nuestra App
                for (let client of windowClients) {
                    // Si encontramos CUALQUIER pestaña de nuestro sitio
                    if (client.url.startsWith(self.location.origin) && 'focus' in client) {
                        return client.focus().then(focusedClient => {
                            // Una vez en foco, le mandamos a la sección de flota
                            if (focusedClient.navigate) {
                                return focusedClient.navigate(targetUrl);
                            }
                        });
                    }
                }

                // 2. Si no había ninguna pestaña abierta, abrir una nueva
                if (clients.openWindow) {
                    return clients.openWindow(targetUrl);
                }
            })
    );
});
