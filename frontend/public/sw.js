const CACHE_NAME = 'foodies-express-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/menu',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/offline',
  '/favicon.ico',
  '/images/pizza-placeholder.jpg',
  '/images/icons/icon-192.png',
  '/images/icons/icon-512.png',
];

// Install: Cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching static assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Try network first, fallback to cache, fallback to offline page
self.addEventListener('fetch', (event) => {
  // Only handle GET requests and skip API/admin calls
  if (
    event.request.method !== 'GET' || 
    event.request.url.includes('/api/') ||
    event.request.url.includes('/admin') ||
    event.request.url.includes('/_next/')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache dynamic pages if successful and standard HTML
        if (response.status === 200 && response.headers.get('content-type')?.includes('text/html')) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If page navigation request fails, load /offline page
          if (event.request.mode === 'navigate') {
            return caches.match('/offline');
          }
          return new Response('Network error occurred', { status: 408, headers: { 'Content-Type': 'text/plain' } });
        });
      })
  );
});
