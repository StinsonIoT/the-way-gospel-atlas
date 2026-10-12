// The Way — offline cache.
// - Pages: network first (with a short wait), so updates show at once; the
//   saved copy is used when the network is slow to answer or absent.
// - The atlas's own files (scripts, styles, fonts, map data): cache first; their
//   URLs carry a version number, so a new version is a new file.
// - Bible passages and terrain tiles: kept in their own caches, which survive
//   app updates. Terrain keeps the most recent tiles only.
const APP = 'the-way-v28';
const BIBLE = 'the-way-bible';
const TILES = 'the-way-tiles';
const TILE_LIMIT = 900;
const SHELL = ['./', 'index.html', 'about.html', 'sources.html', 'holyweek.html', 'css/page.css?v=5', 'js/reader-lite.js?v=1', 'manifest.webmanifest', 'icon-192.png', 'apple-touch-icon.png',
  'vendor/maplibre-gl.js', 'vendor/maplibre-gl.css',
  'fonts/newsreader.woff2', 'fonts/newsreader-italic.woff2', 'fonts/instrument-sans-400.woff2', 'fonts/instrument-sans-500.woff2', 'fonts/instrument-sans-600.woff2'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(APP).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => k.startsWith('the-way-v') && k !== APP).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

function put(cacheName, req, res) {
  if (!res || !(res.ok || res.type === 'opaque')) return;
  const copy = res.clone();
  caches.open(cacheName).then((c) => c.put(req, copy)).then(() => { if (cacheName === TILES) trimTiles(); });
}
let trimming = false;
function trimTiles() {
  if (trimming) return;
  trimming = true;
  caches.open(TILES).then((c) => c.keys().then((keys) => {
    const extra = keys.length - TILE_LIMIT;
    return extra > 0 ? Promise.all(keys.slice(0, extra).map((k) => c.delete(k))) : null;
  })).finally(() => { trimming = false; });
}
function cacheFirst(cacheName, req) {
  return caches.match(req).then((hit) => hit || fetch(req).then((res) => { put(cacheName, req, res); return res; }));
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;
  const url = new URL(req.url);
  if (req.mode === 'navigate') {
    // Wait up to 4 s for the network, then fall back to the saved page.
    const net = fetch(req).then((res) => { put(APP, req, res); return res; });
    const saved = new Promise((resolve) => setTimeout(() => caches.match(req).then(resolve), 4000));
    e.respondWith(Promise.race([net.catch(() => caches.match(req)), saved.then((r) => r || net)])
      .then((r) => r || caches.match('index.html')));
    return;
  }
  if (url.origin === self.location.origin) { e.respondWith(cacheFirst(APP, req)); return; }
  if (url.hostname === 'bible.helloao.org') { e.respondWith(cacheFirst(BIBLE, req)); return; }
  if (url.hostname === 's3.amazonaws.com' && url.pathname.includes('/terrarium/')) { e.respondWith(cacheFirst(TILES, req)); return; }
  // Everything else (audio, other sites) goes straight to the network.
});
