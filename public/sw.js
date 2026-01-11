// Define a unique cache name for this version of your app
const CACHE_NAME = 'cesars-barberia-cache-v1';

// List all the assets that need to be cached
const urlsToCache = [
  '/',
  '/login',
  '/impuestos',
  // Note: Add paths to your key static assets here.
  // Be careful not to cache everything, especially large files or API calls.
  // The manifest and icons are good candidates.
  '/manifest.json',
  '/logo-192.png',
  '/logo-512.png',
  '/logo.png'
];

// Install event: fires when the service worker is first installed.
self.addEventListener('install', (event) => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // Add all the assets to the cache
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('Failed to open cache', err);
      })
  );
});

// Fetch event: fires for every network request.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response from the cache
        if (response) {
          return response;
        }

        // Not in cache - fetch from the network
        return fetch(event.request);
      })
  );
});

// Activate event: fires when the service worker is activated.
// This is a good place to clean up old caches.
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // If this cache name is not in our whitelist, delete it.
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
