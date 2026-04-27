const CACHE_NAME = 'flavias-bakery-v1';

// Librerías externas: cache-first (nunca cambian)
const CDN_URLS = [
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(CDN_URLS).catch(function() {});
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
  if (CDN_URLS.some(function(u) { return url.startsWith(u.split('@')[0]); }) ||
      url.includes('jsdelivr.net') || url.includes('fonts.google')) {
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

  // Archivos propios (JS, CSS, HTML, imágenes) → network-first con fallback a caché
  e.respondWith(
    fetch(e.request).then(function(res) {
      // Guardar copia fresca en caché para uso offline
      var clone = res.clone();
      caches.open(CACHE_NAME).then(function(c) { c.put(e.request, clone); });
      return res;
    }).catch(function() {
      // Sin red → servir desde caché
      return caches.match(e.request);
    })
  );
});
