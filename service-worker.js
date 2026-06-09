const CACHE_NAME = 'flavias-bakery-v15';

const CDN_URLS = [
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js'
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
  './js/views/zelle.js',
  './js/firebase-config.js',
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
  var req = e.request;
  var url = req.url;

  // NO interceptar peticiones que no sean GET (login, escrituras, etc.)
  if (req.method !== 'GET') return;

  // NO interceptar las APIs de Firebase (Auth/Firestore) — deben ir directo a la red.
  // Si el SW las cachea, rompe el login y la sincronización.
  if (url.indexOf('firestore.googleapis.com')          !== -1 ||
      url.indexOf('identitytoolkit.googleapis.com')     !== -1 ||
      url.indexOf('securetoken.googleapis.com')         !== -1 ||
      url.indexOf('firebaseinstallations.googleapis.com')!== -1 ||
      url.indexOf('firebaseio.com')                     !== -1 ||
      url.indexOf('firebaseapp.com')                    !== -1 ||
      url.indexOf('www.googleapis.com')                 !== -1) {
    return;
  }

  // CDN de librerías + fuentes + SDK de Firebase → cache-first
  if (url.indexOf('jsdelivr.net')       !== -1 ||
      url.indexOf('fonts.googleapis')   !== -1 ||
      url.indexOf('fonts.gstatic')      !== -1 ||
      url.indexOf('gstatic.com/firebasejs') !== -1 ||
      url.indexOf('www.gstatic.com')    !== -1) {
    e.respondWith(
      caches.match(req).then(function(cached) {
        return cached || fetch(req).then(function(res) {
          var clone = res.clone();
          caches.open(CACHE_NAME).then(function(c) { c.put(req, clone); });
          return res;
        });
      })
    );
    return;
  }

  // Archivos propios → network-first SALTANDO la caché HTTP del navegador
  // (evita que GitHub Pages sirva JS/CSS viejo), con fallback a caché offline
  e.respondWith(
    fetch(req, { cache: 'no-store' }).then(function(res) {
      var clone = res.clone();
      caches.open(CACHE_NAME).then(function(c) { c.put(req, clone); });
      return res;
    }).catch(function() {
      return caches.match(req);
    })
  );
});
