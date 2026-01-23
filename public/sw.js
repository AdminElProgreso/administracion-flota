// Service Worker v1.6 - Modo Depuración Total
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('push', function (event) {
    console.log('[SW] Push recibido');

    let message = 'Nueva alerta de flota';
    if (event.data) {
        message = event.data.text();
        console.log('[SW] Contenido:', message);
    }

    // Chrome EXIGE que se devuelva la promesa de showNotification
    const promise = self.registration.showNotification('El Progreso - Flota', {
        body: message,
        icon: '/pwa-192x192.png',
        tag: 'fleet-alert',
        renotify: true
    });

    event.waitUntil(promise);
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(clients.openWindow('/'));
});
