const CACHE_NAME = 'fieldforce-static-v5';

const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './api-service.js',
  './config.js',
  './js/indexed-db.js',
  './js/sync-queue.js',
  './js/geofence.js',
  './manifest.json',
  // Si hubiera íconos locales, también irían aquí
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // El Service Worker SOLO debe interceptar peticiones GET estáticas a los assets locales.
  // Peticiones a Apps Script (POST) y otras APIs externas las ignoramos para que el navegador
  // o la capa de IndexedDB + SyncQueue las gestione.
  
  const requestUrl = new URL(event.request.url);
  
  if (event.request.method === 'GET' && requestUrl.origin === location.origin) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return cachedResponse || fetch(event.request).then((response) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, response.clone());
            return response;
          });
        });
      })
    );
  }
});
