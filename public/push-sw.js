// Inkorium PWA - Service Worker Push & Notification Handler
/* eslint-disable no-restricted-globals */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// 1. Escuchar eventos PUSH entrantes desde el servidor web-push
self.addEventListener('push', (event) => {
  let data = {};
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (err) {
      data = {
        title: 'Inkorium',
        body: event.data.text() || 'Tienes una nueva notificación'
      };
    }
  }

  const title = data.title || 'Inkorium - Notificación';
  const notificationOptions = {
    body: data.body || data.mensaje || 'Tienes una nueva interacción en tu cuenta.',
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/pwa-192x192.png',
    data: data.data || data,
    tag: data.tag || `inkorium-${Date.now()}`,
    renotify: true,
    vibrate: [150, 80, 150],
    requireInteraction: false,
    actions: data.actions || [
      { action: 'view', title: '👀 Ver ahora' },
      { action: 'dismiss', title: 'Cerrar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, notificationOptions)
  );
});

// 2. Gestionar clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const notifData = event.notification.data || {};
  const targetUrl = notifData.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si ya hay una pestaña abierta de Inkorium, la enfocamos y enviamos mensaje
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({
            type: 'PUSH_NOTIFICATION_CLICK',
            data: notifData,
            url: targetUrl
          });
          return client.focus();
        }
      }
      // Si no hay ventana abierta, abrimos una nueva
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// 3. Notificación cerrada por el usuario
self.addEventListener('notificationclose', (event) => {
  const notifData = event.notification.data;
  console.log('[Push SW] Notificación cerrada:', notifData?.tag || 'sin tag');
});

// 4. Mensajes directos desde el cliente hacia el Service Worker
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'SHOW_LOCAL_NOTIFICATION') {
    const { title, options } = event.data;
    const finalOptions = {
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: [150, 80, 150],
      ...(options || {})
    };
    self.registration.showNotification(title || 'Inkorium', finalOptions);
  }
});
