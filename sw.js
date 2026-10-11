// The Way — offline cache. Pages load from the network first so updates show
// at once; the map engine, styles, scripts and map data are served from cache
// (their URLs carry a version number, so a new version is a new file).
const CACHE = 'the-way-v7';
const SHELL = ['./', 'index.html', 'about.html', 'sources.html', 'manifest.webmanifest', 'icon-192.png', 'apple-touch-icon.png',
  'vendor/maplibre-gl.js', 'vendor/maplibre-gl.css'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  // Pages: network first, fall back to cache when offline.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })
      .catch(() => caches.match(req).then((r) => r || caches.match('index.html'))));
    return;
  }
  // Own files and Bible passages: cache first, then network (and store).
  const bible = url.hostname === 'bible.helloao.org';
  if (sameOrigin || bible) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    })));
  }
  // Everything else (terrain tiles, fonts) goes straight to the network.
});
