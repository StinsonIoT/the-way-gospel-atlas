const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const app = fs.readFileSync('js/app.js', 'utf8');
const origin = 'https://example.org/the-way-gospel-atlas/';

async function checkWorker() {
  const hooks = {}, stores = new Map([['the-way-v36', new Map()], ['the-way-bible', new Map()], ['the-way-tiles', new Map()]]);
  const key = req => new URL(typeof req === 'string' ? req : req.url, origin).href;
  let skipped = false;
  const caches = {
    open: async name => {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return {
        addAll: async urls => { for (const url of urls) { const file = url === './' ? 'index.html' : url.split('?')[0]; assert(fs.existsSync(file), 'precache file exists: ' + file); store.set(key(url), { url: key(url) }); } },
        match: async req => store.get(key(req))
      };
    },
    keys: async () => [...stores.keys()],
    delete: async name => stores.delete(name),
    match: async req => { for (const store of stores.values()) if (store.has(key(req))) return store.get(key(req)); }
  };
  const ctx = { caches, URL, fetch: async () => { throw Error('offline'); }, self: {
    location: { origin: new URL(origin).origin },
    addEventListener: (name, fn) => { hooks[name] = fn; },
    skipWaiting: async () => { skipped = true; }, clients: { claim: async () => {} }
  } };
  vm.createContext(ctx); vm.runInContext(fs.readFileSync('sw.js', 'utf8'), ctx);
  let task; hooks.install({ waitUntil: p => { task = p; } }); await task;
  assert(skipped);
  hooks.activate({ waitUntil: p => { task = p; } }); await task;
  assert(!stores.has('the-way-v36')); assert(stores.has('the-way-bible')); assert(stores.has('the-way-tiles'));
  const index = fs.readFileSync('index.html', 'utf8');
  const assets = [...index.matchAll(/(?:src|href)="((?:js|css|vendor)\/[^\"]+)"/g)].map(m => m[1]);
  assets.push(...[...app.matchAll(/['"](data\/(?!bsb\/)[^'"`]+\.json\?v=\d+)['"]/g)].map(m => m[1]));
  // Fonts are requested by CSS after the page has loaded.
  assets.push(...[...fs.readFileSync('css/fonts.css', 'utf8').matchAll(/url\(['"]?\.\.\/([^)'" ]+)/g)].map(m => m[1]));
  for (const asset of new Set(assets)) {
    let response;
    hooks.fetch({ request: { url: key(asset), method: 'GET', mode: 'cors', headers: { has: () => false } }, respondWith: p => { response = p; } });
    assert(await response, 'available offline after update: ' + asset);
  }
  skipped = false;
  ctx.caches.open = async () => ({ addAll: async () => { throw Error('incomplete download'); } });
  hooks.install({ waitUntil: p => { task = p; } });
  await assert.rejects(task, /incomplete download/);
  assert(!skipped, 'incomplete shell must not activate');
}

async function checkReaderTimeout() {
  const source = fs.readFileSync('js/reader-lite.js', 'utf8');
  const requested = [];
  let timeout, cleared = false;
  const ctx = {
    Map, AbortController,
    setTimeout: (fn, ms) => { assert.equal(ms, 9000); timeout = fn; return 1; },
    clearTimeout: () => { cleared = true; },
    fetch: (url, opts) => {
      requested.push(url);
      if (url.startsWith('data/')) return Promise.resolve({ ok: true, json: async () => JSON.parse(fs.readFileSync(url.split('?')[0], 'utf8')) });
      return new Promise((resolve, reject) => opts.signal.addEventListener('abort', () => reject(Error('aborted'))));
    }
  };
  vm.createContext(ctx); vm.runInContext(source.slice(source.indexOf('const cache ='), source.indexOf('function verseHTML')), ctx);
  const pending = ctx.getText('JHN', 1); timeout();
  const chapter = await pending;
  assert(chapter.savedCopy); assert(chapter.chapter.content.some(x => x.type === 'verse'));
  assert(cleared); assert(requested.includes('data/bsb/JHN.json?v=1'));
  const retry = ctx.getText('JHN', 1); timeout(); await retry;
  assert.equal(requested.filter(x => x.startsWith('https:')).length, 2, 'failed API request is retryable');
}

async function checkOfflineSave() {
  const requested = [], saved = new Map();
  const ctx = {
    URL, location: { href: origin }, BSB_LOCAL_V: 1,
    API_BOOK: { matthew: 'MAT', mark: 'MRK', luke: 'LUK', john: 'JHN', acts: 'ACT' },
    caches: { open: async () => { throw Error('storage denied'); } },
    fetch: async url => { requested.push(url); return { ok: true, status: 200 }; },
    localStorage: { setItem: () => {} }
  };
  vm.createContext(ctx);
  vm.runInContext(app.slice(app.indexOf('const OFFLINE_BOOKS ='), app.indexOf("planBody.addEventListener('click'")), ctx);
  const btn = { disabled: false, isConnected: true };
  await ctx.saveOffline(btn);
  assert(!btn.disabled); assert.match(btn.textContent, /storage is unavailable/);
  assert.equal(vm.runInContext('savingOffline', ctx), false);
  ctx.caches.open = async () => ({ match: async url => saved.get(url), put: async (url, res) => saved.set(url, res) });
  await ctx.saveOffline(btn);
  assert(!btn.disabled); assert.match(btn.textContent, /Saved for offline/);
  assert(requested.includes('https://bible.helloao.org/api/BSB/ACT/2.json'));
  assert(saved.has('https://bible.helloao.org/api/c/tyndale/ACT/2.json'));
  saved.clear(); ctx.fetch = async () => { throw Error('network down'); };
  await ctx.saveOffline(btn);
  assert(!btn.disabled); assert.match(btn.textContent, /Try again/);
  assert.equal(vm.runInContext('savingOffline', ctx), false);
}

(async () => {
  await checkWorker(); await checkReaderTimeout(); await checkOfflineSave();
  console.log('PASS: offline assets survive updates; incomplete installs do not activate; reader timeout uses saved BSB and permits retries; storage/network failures permit download retries; Acts 2 text and notes are saved.');
})().catch(err => { console.error(err); process.exitCode = 1; });
