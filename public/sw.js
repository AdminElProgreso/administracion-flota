self.addEventListener('push', function (event) {
    console.log('Push recibido:', event);

    let data = {};
    try {
        // Intentar parsear como JSON, si falla, tratar como texto
        data = event.data ? event.data.json() : {};
    } catch (e) {
        console.warn('El payload no es JSON, usando como texto:', event.data.text());
        data = { body: event.data.text() };
    }

    const title = data.title || 'Alerta El Progreso';
    const options = {
        body: data.body || 'Tienes un nuevo aviso del sistema.',
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        vibrate: [200, 100, 200],
        tag: data.tag || 'alert-default',
        renotify: true,
        data: {
            url: data.url || '/'
        }
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
            .catch(err => console.error('Error al mostrar notificación:', err))
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    const targetUrl = event.notification.data.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            // Si la app ya está abierta, ir a esa pestaña
            for (let client of windowClients) {
                if (client.url === targetUrl && 'focus' in client) {
                    return client.focus();
                }
            }
            // Si no, abrir una nueva
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
