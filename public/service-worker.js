self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  // Only cache static assets, never sensitive vault data
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api') || url.pathname.endsWith('.json')) return;
  event.respondWith(
    caches.open('oxidiko-static-v1').then(cache =>
      cache.match(event.request).then(response =>
        response || fetch(event.request).then(networkResponse => {
          if (networkResponse.ok && networkResponse.type === 'basic') {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        })
      )
    )
  );
});
