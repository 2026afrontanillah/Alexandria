const CACHE_NAME = 'alexandria-v27';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/app.js',
  './js/avatar.js',
  './js/avatar-landmarks.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/apple-touch-icon.png',
  './assets/philosophers/socrates.jpg',
  './assets/philosophers/plato.jpg',
  './assets/philosophers/aristotle.jpg',
  './assets/philosophers/video/socrates.jpg',
  './assets/philosophers/video/plato.jpg',
  './assets/philosophers/video/aristotle.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => console.warn('PWA asset cache note:', err));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Let external requests (ElevenLabs, Stripe, Google Fonts, CDNs) pass directly to network
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  // Videos: directo a la red (el navegador los pide por partes)
  if (event.request.destination === 'video' || event.request.headers.has('range') || event.request.url.endsWith('.mp4')) {
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
