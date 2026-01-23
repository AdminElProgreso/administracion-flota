// Custom Push Notification Logic
// Imported into the main sw.js by VitePWA

self.addEventListener('push', (event) => {
    console.log('[SW-Push] Signal received');

    let text = 'Hay nuevos vencimientos en la flota';
    if (event.data) {
        try {
            // Try to see if it's plain text or JSON
            text = event.data.text();
        } catch (e) {
            console.error('Error reading push data');
        }
    }

    const promise = self.registration.showNotification('El Progreso - Gestión', {
        body: text,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: 'fleet-alert-unique',
        renotify: true
    });

    event.waitUntil(promise);
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            if (windowClients.length > 0) {
                return windowClients[0].focus();
            }
            return clients.openWindow('/');
        })
    );
});
