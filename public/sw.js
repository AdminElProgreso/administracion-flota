// Service Worker v1.8 - Final Fix
self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));

self.addEventListener('push', (event) => {
    console.log('[SW] Señal de red recibida');

    // Extraemos el texto con seguridad
    let text = 'Nueva alerta de flota disponible';
    if (event.data) {
        try {
            text = event.data.text();
        } catch (e) {
            console.error('Error al leer el texto del push');
        }
    }

    // Chrome exige que showNotification sea lo último que hagamos dentro de waitUntil
    const notificationPromise = self.registration.showNotification('El Progreso - Gestión', {
        body: text,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: 'fleet-alert-final',
        renotify: true
    });

    event.waitUntil(notificationPromise);
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
