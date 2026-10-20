// The Way — offline cache.
// - Pages: network first (with a short wait), so updates show at once; the
//   saved copy is used when the network is slow to answer or absent.
// - The atlas's own files (scripts, styles, fonts, map data): cache first; their
//   URLs carry a version number, so a new version is a new file.
// - Bible passages and terrain tiles: kept in their own caches, which survive
//   app updates. Terrain keeps the most recent tiles only.
const APP = 'the-way-v52';
const BIBLE = 'the-way-bible';
const TILES = 'the-way-tiles';
const TILE_LIMIT = 900;
const SHELL = ['./', 'index.html', 'about.html', 'sources.html', 'holyweek.html', 'css/page.css?v=5', 'js/reader-lite.js?v=4', 'manifest.webmanifest', 'icon-192.png', 'apple-touch-icon.png',
  'css/fonts.css?v=1', 'css/style.css?v=62',
  'js/scenes.js?v=56', 'js/places.js?v=7', 'js/study.js?v=11', 'js/otrefs.js?v=1',
  'js/guide.js?v=3', 'js/tour.js?v=2', 'js/audio-boundaries.js?v=1', 'js/experience.js?v=50', 'js/app.js?v=70',
  'vendor/maplibre-contour.min.js?v=47',
  'data/land-wide.json?v=1', 'data/rome.json?v=1', 'data/land.json?v=9',
  'data/lakes.json?v=11', 'data/rivers.json?v=9', 'data/jerusalem.json?v=10',
  'data/jerusalem3d.json?v=10', 'data/capernaum3d.json?v=12',
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

async function put(cacheName, req, res) {
  if (!res || !(res.ok || res.type === 'opaque')) return;
  const copy = res.clone();
  const cache = await caches.open(cacheName);
  await cache.put(req, copy);
  if (cacheName === TILES) await trimTiles();
}
let trimming = false;
async function trimTiles() {
  if (trimming) return;
  trimming = true;
  try {
    const c = await caches.open(TILES), keys = await c.keys();
    const extra = keys.length - TILE_LIMIT;
    if (extra > 0) await Promise.all(keys.slice(0, extra).map((k) => c.delete(k)));
  } finally { trimming = false; }
}
const match = req => caches.match(req).catch(() => undefined);
function cacheFirst(cacheName, req, event) {
  let write;
  const response = match(req).then((hit) => hit || fetch(req).then((res) => { write = put(cacheName, req, res); return res; }));
  // Register while the fetch event is active. Persistence is separate from the
  // response, so storage failure does not discard a successful network reply.
  event.waitUntil(response.then(() => write).catch(() => {}));
  return response;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;
  const url = new URL(req.url);
  if (req.mode === 'navigate') {
    // Wait up to 4 s for the network, then fall back to the saved page.
    let write;
    const net = fetch(req).then((res) => { write = put(APP, req, res); return res; });
    e.waitUntil(net.then(() => write).catch(() => {}));
    const saved = new Promise((resolve) => setTimeout(() => match(req).then(resolve), 4000));
    e.respondWith(Promise.race([net.catch(() => match(req)), saved.then((r) => r || net)])
      .then((r) => r || match('index.html')));
    return;
  }
  if (url.origin === self.location.origin) { e.respondWith(cacheFirst(APP, req, e)); return; }
  if (url.hostname === 'bible.helloao.org') { e.respondWith(cacheFirst(BIBLE, req, e)); return; }
  if (url.hostname === 's3.amazonaws.com' && url.pathname.includes('/terrarium/')) { e.respondWith(cacheFirst(TILES, req, e)); return; }
  // Everything else (audio, other sites) goes straight to the network.
});
