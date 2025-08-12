// Service Worker for caching Pokemon data
const CACHE_NAME = 'pokedex-cache-v1';
const STATIC_CACHE = 'pokedex-static-v1';

// Cache manifest files and essential data
const urlsToCache = [
  '/output/manifests/pokemon.json',
  '/output/manifests/moves.json', 
  '/output/manifests/items.json',
  '/output/manifests/abilities.json',
  '/pokemon.json'
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache first, then network
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Check if this is a request for our cached data
  const url = new URL(event.request.url);
  const isDataRequest = url.pathname.includes('/output/') || 
                       url.pathname.includes('/pokemon.json');

  if (isDataRequest) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Return cached version if available
          if (response) {
            // Also fetch in background to update cache
            fetch(event.request).then((fetchResponse) => {
              if (fetchResponse.ok) {
                caches.open(STATIC_CACHE).then((cache) => {
                  cache.put(event.request, fetchResponse.clone());
                });
              }
            }).catch(() => {
              // Ignore network errors when updating cache
            });
            
            return response;
          }
          
          // If not in cache, fetch from network and cache
          return fetch(event.request).then((fetchResponse) => {
            if (!fetchResponse || fetchResponse.status !== 200) {
              return fetchResponse;
            }
            
            const responseToCache = fetchResponse.clone();
            caches.open(STATIC_CACHE)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return fetchResponse;
          });
        })
    );
  }
});