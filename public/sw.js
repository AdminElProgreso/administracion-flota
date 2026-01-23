// Service Worker v1.5 - Diagnóstico Directo
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
    console.log('[SW] Señal Push recibida');

    let title = 'Alerta El Progreso';
    let body = 'Tienes un aviso pendiente.';

    if (event.data) {
        try {
            const data = event.data.json();
            title = data.title || title;
            body = data.body || body;
        } catch (e) {
            body = event.data.text() || body;
        }
    }

    const promise = self.registration.showNotification(title, {
        body: body,
        tag: 'fleet-alert-unique', // Evita que se amontonen
        renotify: true
        // Quitamos iconos temporalmente para descartar errores de carga
    });

    event.waitUntil(promise);
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
            for (let client of clients) {
                if ('focus' in client) return client.focus();
            }
            if (clients.openWindow) return clients.openWindow('/');
        })
    );
});
