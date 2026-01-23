// Service Worker v1.9 - Sin imágenes (Prueba de compatibilidad)
self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));

self.addEventListener('push', (event) => {
    // Extraer texto o poner uno por defecto
    const text = event.data ? event.data.text() : 'Hay nuevos vencimientos en la flota';

    // Título con versión para confirmar que el cambio llegó
    const title = 'ALERTA FLOTA v1.9';

    // IMPORTANTE: En Windows/Chrome, a veces los iconos causan el error 
    // de "actualizado en segundo plano" si fallan. Los quitamos para probar.
    const promise = self.registration.showNotification(title, {
        body: text,
        tag: 'fleet-unique-tag',
        renotify: true
    });

    event.waitUntil(promise);
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(clients.openWindow('/'));
});
