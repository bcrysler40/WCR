/* Builder Rate Special – offline support. Bump VERSION when the page changes. */
const VERSION = 'brs-v1';
const SHELL = ['/', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/apple-touch-icon.png'];
const LIBS = /^https:\/\/(unpkg\.com|cdnjs\.cloudflare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)\//;
const TILES = /^https:\/\/server\.arcgisonline\.com\//;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== 'brs-tiles').map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                       // form submissions always go to the network
  const url = req.url;
  if (req.mode === 'navigate') {                          // the page: newest copy when online, saved copy when offline
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(VERSION).then(x => x.put('/', c)); return r; })
      .catch(() => caches.match('/')));
    return;
  }
  if (LIBS.test(url) || url.startsWith(self.location.origin + '/icons/')) {   // map/QR libraries, fonts, icons
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { const c = r.clone(); caches.open(VERSION).then(x => x.put(req, c)); return r; })));
    return;
  }
  if (TILES.test(url)) {                                  // map tiles: keep the last ~400 viewed for offline use
    e.respondWith(caches.open('brs-tiles').then(async cache => {
      const hit = await cache.match(req);
      if (hit) return hit;
      try {
        const r = await fetch(req);
        if (r.ok || r.type === 'opaque') {
          cache.put(req, r.clone());
          cache.keys().then(k => { if (k.length > 400) k.slice(0, k.length - 400).forEach(x => cache.delete(x)); });
        }
        return r;
      } catch (_) { return hit || Response.error(); }
    }));
  }
});
