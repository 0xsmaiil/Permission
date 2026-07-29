const CACHE_NAME = 'permission-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      const manifest = self.__WB_MANIFEST;
      if (!manifest) {
        console.warn('[SW] No manifest found, skipping precache');
        return Promise.resolve();
      }
      return cache.addAll(manifest.map((entry) => entry.url));
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

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SHOW_REMINDER') {
    event.waitUntil(
      self.registration.showNotification(event.data.title || 'Permission', {
        body: event.data.body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: 'reminder-' + (event.data.id || Date.now()),
        renotify: true,
        requireInteraction: true,
        silent: false,
        vibrate: [100, 50, 100, 50, 100],
        data: { url: '/' },
      })
    );
  }
});

self.addEventListener('push', (event) => {
  let title = 'Permission';
  let body = 'New notification';
  let dir = 'auto';
  let lang = 'en';
  let actionOpen = 'Open';
  let actionClose = 'Close';

  if (event.data) {
    try {
      const parsed = event.data.json();
      if (parsed.title) title = parsed.title;
      if (parsed.body) body = parsed.body;
      if (parsed.dir) dir = parsed.dir;
      if (parsed.lang) lang = parsed.lang;
      if (parsed.actionOpen) actionOpen = parsed.actionOpen;
      if (parsed.actionClose) actionClose = parsed.actionClose;
    } catch {
      body = event.data.text();
    }
  }

  const options = {
    body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'permission-broadcast',
    renotify: true,
    requireInteraction: false,
    silent: false,
    vibrate: [100, 50, 100],
    dir,
    lang,
    data: { url: '/' },
    actions: [
      { action: 'open', title: actionOpen },
      { action: 'close', title: actionClose },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(title, options).then(() => {
      return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'PUSH_RECEIVED',
            title,
            body,
            timestamp: Date.now(),
          });
        });
      });
    })
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
          client.postMessage({
            type: 'PUSH_RECEIVED',
            title: event.notification.title,
            body: event.notification.body,
            timestamp: Date.now(),
          });
          return client.focus();
        }
      }
      const params = new URLSearchParams({
        nTitle: encodeURIComponent(event.notification.title),
        nBody: encodeURIComponent(event.notification.body),
      });
      return clients.openWindow(`${targetUrl}?${params.toString()}`);
    })
  );
});
