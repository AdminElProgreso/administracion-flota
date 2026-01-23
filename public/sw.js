// Service Worker v1.7 - El más simple posible
self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));

self.addEventListener('push', (event) => {
    const text = event.data ? event.data.text() : 'Alerta de flota recibida';

    // Mostramos la notificación directamente sin buscar iconos ni JSON
    const promise = self.registration.showNotification('El Progreso', {
        body: text,
        tag: 'fleet-alert'
    });

    event.waitUntil(promise);
});
