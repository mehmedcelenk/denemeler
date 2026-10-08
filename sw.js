/* AÖL Dijital Kitapçık Service Worker - PWA Notification Support */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let title = '🔔 Sınıf Odak Bildirimi';
  let body = 'Bir öğrenci siteden ayrıldı veya durumu değişti!';

  if (event.data) {
    try {
      const data = event.data.json();
      if (data.title) title = data.title;
      if (data.body) body = data.body;
    } catch (e) {
      const text = event.data.text();
      if (text) body = text;
    }
  }

  const options = {
    body,
    icon: './favicon.ico',
    badge: './favicon.ico',
    tag: 'aol-focus-alert',
    renotify: true,
    vibrate: [300, 100, 300, 100, 300],
    data: {
      url: self.location ? self.location.origin : '/',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('./');
      }
    })
  );
});
