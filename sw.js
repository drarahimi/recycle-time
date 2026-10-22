// Single source of truth for cache versioning: bump on every release.
const CACHE_VERSION = 17;
const CACHE_NAME = `windsor-recycle-v${CACHE_VERSION}`;
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-192.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
  './favicon-32.png',
  './fonts/vazirmatn.css',
  './fonts/Vazirmatn-Variable.woff2',
  './fonts/fontawesome.min.css',
  './fonts/fa/fa-solid-900.woff2',
  './fonts/fa/fa-regular-400.woff2'
];

// Install Event - Force Immediately Active
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // 'reload' bypasses the HTTP cache so a new version never pre-caches stale files
      return cache.addAll(ASSETS_TO_CACHE.map((url) => new Request(url, { cache: 'reload' })));
    })
  );
});

// Activate Event - Purge Old Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Network First Strategy for Fresh Development Updates
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});
