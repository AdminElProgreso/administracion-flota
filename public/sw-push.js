// Custom Push Notification Logic - Mobile Navigation Fix v4.0
// Este archivo es el corazón de las notificaciones para móviles.

self.addEventListener('push', (event) => {
    let data = {
        title: 'Gestión El Progreso',
        body: 'Tienes una nueva alerta de flota.',
        url: '/fleet'
    };

    if (event.data) {
        try {
            const json = event.data.json();
            data.title = json.title || data.title;
            data.body = json.body || data.body;
            data.url = json.url || data.url;
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: 'fleet-alert-unique',
        renotify: true,
        vibrate: [100, 50, 100],
        data: {
            url: data.url
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    // Cerramos la notificación inmediatamente
    event.notification.close();

    // Obtenemos la URL de destino (siempre absoluta)
    const urlToOpen = new URL(event.notification.data.url || '/fleet', self.location.origin).href;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((windowClients) => {
                // Si la App ya está abierta, la traemos al frente y navegamos
                for (let client of windowClients) {
                    if (client.url.startsWith(self.location.origin) && 'focus' in client) {
                        client.navigate(urlToOpen);
                        return client.focus();
                    }
                }
                // Si la App está cerrada, abrimos una nueva ventana (esto abre la PWA)
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});
