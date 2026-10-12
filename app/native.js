// The Way — app-only additions, loaded before the atlas scripts in the iPhone
// and iPad app (see build.mjs). The website does not load this file.
//
// - Shared links point to the website, not to the app's local address.
// - Scripture works offline: the whole Berean Standard Bible is bundled in the
//   app (bible/BSB/<book>/<chapter>.json, generated with the Free Use Bible
//   API's own tools). Passages still come from the network first when there is
//   a connection, for audio links and timings; every answer from the API
//   (including study notes) is kept on the device for next time.
(function () {
  window.WAY_SITE = 'https://stinsoniot.github.io/the-way-gospel-atlas/';
  window.WAY_NATIVE = true;
  document.documentElement.classList.add('native');

  // ---------- a small key-value store (IndexedDB) ----------
  let dbp = null;
  function db() {
    if (!dbp) {
      dbp = new Promise((resolve, reject) => {
        const req = indexedDB.open('the-way', 1);
        req.onupgradeneeded = () => req.result.createObjectStore('json');
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }).catch(() => null);
    }
    return dbp;
  }
  async function idbGet(key) {
    const d = await db();
    if (!d) return null;
    return new Promise((resolve) => {
      try {
        const r = d.transaction('json').objectStore('json').get(key);
        r.onsuccess = () => resolve(r.result || null);
        r.onerror = () => resolve(null);
      } catch (err) { resolve(null); }
    });
  }
  async function idbPut(key, text) {
    const d = await db();
    if (!d) return;
    try { d.transaction('json', 'readwrite').objectStore('json').put(text, key); } catch (err) { /* full or closed */ }
  }

  // ---------- fetch: network, then device, then the bundled Bible ----------
  const API = 'https://bible.helloao.org/';
  const netFetch = window.fetch.bind(window);
  const json = (text, status) => new Response(text, { status: status || 200, headers: { 'Content-Type': 'application/json' } });
  function bundled(url) {
    const m = /^https:\/\/bible\.helloao\.org\/api\/BSB\/([1-3A-Z]{3})\/(\d+)\.json$/.exec(url);
    if (!m) return Promise.resolve(null);
    return netFetch(`bible/BSB/${m[1]}/${m[2]}.json`).then((r) => (r.ok ? r.text() : null)).catch(() => null);
  }
  function withTimeout(p, ms) {
    return Promise.race([p, new Promise((resolve, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);
  }
  window.fetch = async function (input, init) {
    const url = typeof input === 'string' ? input : input && input.url;
    if (!url || !url.startsWith(API) || !/\.json(\?|$)/.test(url) || (init && init.method && init.method !== 'GET')) return netFetch(input, init);
    if (navigator.onLine !== false) {
      try {
        const res = await withTimeout(netFetch(input, init), 6000);
        if (res.ok) { res.clone().text().then((t) => idbPut(url, t)); return res; }
        if (res.status === 404) return res;
      } catch (err) { /* offline or slow: fall through */ }
    }
    const kept = await idbGet(url);
    if (kept) return json(kept);
    const local = await bundled(url);
    if (local) return json(local);
    return json('{"error":"offline"}', 503);
  };
})();
