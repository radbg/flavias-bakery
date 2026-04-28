const CACHE_NAME = 'flavias-bakery-v3';

const CDN_URLS = [
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap'
];

// App shell — todo lo necesario para funcionar offline
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/storage.js',
  './js/calculations.js',
  './js/components/toast.js',
  './js/components/modal.js',
  './js/components/nav.js',
  './js/views/dashboard.js',
  './js/views/register-sale.js',
  './js/views/history.js',
  './js/views/catalog.js',
  './js/views/expenses.js',
  './js/views/monthly-report.js',
  './js/app.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/logo.png'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      // Pre-cachear app shell (crítico para offline)
      return cache.addAll(APP_SHELL).then(function() {
        // CDN en background, no bloquea install
        return cache.addAll(CDN_URLS).catch(function() {});
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  var url = e.request.url;

  // CDN → cache-first
  if (url.includes('jsdelivr.net') || url.includes('fonts.google') || url.includes('gstatic.com')) {
    e.respondWith(
      caches.match(e.request).then(function(cached) {
        return cached || fetch(e.request).then(function(res) {
          var clone = res.clone();
          caches.open(CACHE_NAME).then(function(c) { c.put(e.request, clone); });
          return res;
        });
      })
    );
    return;
  }

  // Archivos propios → network-first con fallback a caché (ya pre-cacheados)
  e.respondWith(
    fetch(e.request).then(function(res) {
      var clone = res.clone();
      caches.open(CACHE_NAME).then(function(c) { c.put(e.request, clone); });
      return res;
    }).catch(function() {
      return caches.match(e.request);
    })
  );
});
