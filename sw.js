const SW_VERSION = 'solar-khata-v5';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './css/style.css',
  './js/util.js',
  './js/db.js',
  './js/ui.js',
  './js/auth.js',
  './js/stock.js',
  './js/invoices.js',
  './js/khata.js',
  './js/dashboard.js',
  './js/backup.js',
  './js/import.js',
  './js/settings.js',
  './js/app.js'
];

self.addEventListener('install', (e) => {
  // cache:'reload' bypasses the browser HTTP cache so version bumps always apply
  e.waitUntil(
    caches.open(SW_VERSION)
      .then((c) => Promise.all(ASSETS.map((a) => c.add(new Request(a, { cache: 'reload' })))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SW_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(SW_VERSION).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
