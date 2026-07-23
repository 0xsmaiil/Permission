const CACHE_NAME = 'permission-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(self.__WB_MANIFEST.map((entry) => entry.url));
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.mode === 'navigate' || url.pathname === '/') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
          }
          return response;
        })
        .catch(() =>
          caches.match(event.request).then((cached) => cached || caches.match('/offline.html'))
        )
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request).catch(() => {
        if (event.request.destination === 'document') {
          return caches.match('/offline.html');
        }
        return new Response('', { status: 503 });
      }))
  );
});

self.addEventListener('push', (event) => {
  let title = 'Permission | حاسبة العطل';
  let body = 'لديك رسالة جديدة.';

  if (event.data) {
    try {
      const parsed = event.data.json();
      if (parsed.title) title = parsed.title;
      if (parsed.body) body = parsed.body;
    } catch {
      body = event.data.text();
    }
  }

  const options = {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'permission-broadcast',
    renotify: true,
    requireInteraction: false,
    silent: false,
    vibrate: [100, 50, 100],
    dir: 'rtl',
    lang: 'ar',
    data: { url: '/' },
    actions: [
      { action: 'open', title: 'فتح التطبيق' },
      { action: 'close', title: 'إغلاق' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});
