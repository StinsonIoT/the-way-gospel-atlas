// The Way — offline cache.
// - Pages: network first (with a short wait), so updates show at once; the
//   saved copy is used when the network is slow to answer or absent.
// - The atlas's own files (scripts, styles, fonts, map data): cache first; their
//   URLs carry a version number, so a new version is a new file.
// - Bible passages and terrain tiles: kept in their own caches, which survive
//   app updates. Terrain keeps the most recent tiles only.
const APP = 'the-way-app-965bed9fbca6';
const BIBLE = 'the-way-bible';
const TILES = 'the-way-tiles';
const MODELS = 'the-way-models';
const TILE_LIMIT = 900;
const SHELL = ['./', 'index.html', 'about.html', 'sources.html', 'holyweek.html', 'css/page.css?v=ccfd8c74ecdd', 'js/reader-lite.js?v=5cd183ff9113', 'manifest.webmanifest', 'icon-192.png', 'apple-touch-icon.png',
  'css/fonts.css?v=1413b6528dbb', 'css/style.css?v=f033bbae0519', 'css/refinement.css?v=2131b90a9d51', 'css/reading.css?v=f7b987ff4159',
  'js/scenes.js?v=35bd50024dd5', 'js/places.js?v=725d8aafda9b', 'js/study.js?v=c862157291a2', 'js/otrefs.js?v=a0477debc084',
  'js/guide.js?v=dde28f2fd8d5', 'js/tour.js?v=64c11d1e8cfe', 'js/audio-boundaries.js?v=fefa57bf1795', 'js/experience.js?v=e49ff37b5e3b', 'js/listening.js?v=b98f9e3474b3', 'js/journey.js?v=c91f2ffb258a', 'js/session.js?v=80e5454ea0d4', 'js/journal.js?v=78291cfaf291', 'js/player.js?v=8d8b83dbc9f7', 'js/app.js?v=8d62b724d2e4',
  'vendor/maplibre-contour.min.js?v=e558b23125a1',
  'data/land-wide.json?v=1', 'data/rome.json?v=1', 'data/land.json?v=9',
  'data/lakes.json?v=11', 'data/rivers.json?v=9', 'data/jerusalem.json?v=10', 'data/paper-grain.svg?v=919abff60a2e',
  'vendor/maplibre-gl.js?v=be9633c4d870', 'vendor/maplibre-gl.css?v=576b085fdd94',
  'fonts/newsreader.woff2', 'fonts/newsreader-italic.woff2', 'fonts/instrument-sans-400.woff2', 'fonts/instrument-sans-500.woff2', 'fonts/instrument-sans-600.woff2'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(APP).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => /^the-way-(?:v\d+|app-[a-f0-9]+|[a-f0-9]{12})$/.test(k) && k !== APP).map((k) => caches.delete(k))))
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
  if (url.origin === self.location.origin) {
    const model = /\/(?:jerusalem3d|capernaum3d)\.json$/.test(url.pathname);
    e.respondWith(cacheFirst(model ? MODELS : APP, req, e)); return;
  }
  if (url.hostname === 'bible.helloao.org') { e.respondWith(cacheFirst(BIBLE, req, e)); return; }
  if (url.hostname === 's3.amazonaws.com' && url.pathname.includes('/terrarium/')) { e.respondWith(cacheFirst(TILES, req, e)); return; }
  // Everything else (audio, other sites) goes straight to the network.
});
