// Custom Push Notification Logic - HashRouter Fix v4.2
// Asegura que la navegación funcione con el sistema de numeral (#) de React.

self.addEventListener('push', (event) => {
    let data = {
        title: 'Gestión El Progreso',
        body: 'Tienes una nueva alerta de flota.',
        url: '/#/fleet' // Corregido para HashRouter
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
            url: new URL(data.url, self.location.origin).href
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const urlToOpen = event.notification.data.url;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((windowClients) => {
                for (let client of windowClients) {
                    if (client.url.startsWith(self.location.origin) && 'focus' in client) {
                        client.navigate(urlToOpen);
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});
