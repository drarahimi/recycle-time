// Single source of truth for cache versioning: bump on every release.
const CACHE_VERSION = 19;
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

// Fetch Event - Stale-While-Revalidate: serve from cache instantly, refresh in the background
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request, { ignoreSearch: true });
      const refresh = fetch(request, { cache: 'no-cache' })
        .then((response) => {
          if (response && response.status === 200) cache.put(request, response.clone());
          return response;
        })
        .catch(() => null);

      if (cached) {
        event.waitUntil(refresh);
        return cached;
      }
      const fresh = await refresh;
      if (fresh) return fresh;
      if (request.mode === 'navigate') return cache.match('./index.html');
      return Response.error();
    })
  );
});
