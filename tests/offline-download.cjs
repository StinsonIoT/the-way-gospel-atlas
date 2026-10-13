const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('js/app.js', 'utf8');

async function check(stallBody = false, cancel = false) {
  const timers = new Map(), saved = new Map(), requested = [];
  let seq = 0;
  const abortable = signal => new Promise((resolve, reject) => signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true }));
  const ctx = {
    AbortController, DOMException, URL, location: { href: 'https://example.org/atlas/' }, BSB_LOCAL_V: 1,
    API_BOOK: { matthew: 'MAT', mark: 'MRK', luke: 'LUK', john: 'JHN', acts: 'ACT' },
    setTimeout: fn => { timers.set(++seq, fn); return seq; }, clearTimeout: id => timers.delete(id),
    planBody: { querySelector: () => null }, renderPlan: () => {}, localStorage: { setItem: () => {} },
    caches: { open: async () => ({ match: async url => saved.get(url), put: async (url, res) => { if (res.stalledBody) await abortable(res.signal); saved.set(url, res); } }) },
    fetch: (url, options) => {
      requested.push({ url, signal: options?.signal });
      if (url.includes('/data/bsb/')) return Promise.resolve({ ok: true, status: 200 });
      return stallBody ? Promise.resolve({ ok: true, status: 200, stalledBody: true, signal: options?.signal }) : abortable(options?.signal);
    }
  };
  vm.createContext(ctx);
  vm.runInContext(source.slice(source.indexOf('const OFFLINE_BOOKS ='), source.indexOf("planBody.addEventListener('click'")), ctx);
  const button = { disabled: false, isConnected: true };
  const pending = ctx.saveOffline(button);
  for (let i = 0; i < 10 && !requested.some(r => r.url.includes('helloao')); i++) await new Promise(resolve => setImmediate(resolve));
  assert(requested.some(r => r.url.includes('helloao')));
  assert(requested.filter(r => r.url.includes('helloao')).every(r => r.signal), 'offline resource requests must be abortable');
  assert(button.disabled);
  if (cancel) ctx.cancelOffline();
  else { assert(timers.size, 'offline downloads must have a deadline'); [...timers.values()][0](); }
  await pending;
  assert(!button.disabled, 'a stopped batch releases the download button');
  assert.equal(vm.runInContext('savingOffline', ctx), false);
  assert.match(button.textContent, cancel ? /Canceled/ : /Try again/);
  assert(requested.filter(r => r.url.includes('helloao')).every(r => r.signal.aborted), 'remaining workers stop with the batch');
  assert.equal(timers.size, 0, 'all request deadlines are cleaned up');
  const before = requested.length;
  ctx.fetch = async url => { requested.push({ url }); return { ok: true, status: 200 }; };
  await ctx.saveOffline(button);
  assert.match(button.textContent, /Saved for offline/);
  assert(!requested.slice(before).some(r => r.url.includes('/data/bsb/')), 'retry preserves completed resources');
  ctx.fetch = async () => ({ ok: false, status: 404 });
  const missingCache = { match: async () => undefined, put: async () => { throw Error('missing response must not be cached'); } };
  await assert.rejects(ctx.cacheOfflineResource(missingCache, 'https://example.org/atlas/data/bsb/MAT.json?v=1', new AbortController().signal), /404/, 'missing bundled Scripture must not count as saved');
}
(async () => { await check(); await check(true); await check(false, true); console.log('PASS: stalled headers/body stop downloads; cancellation aborts workers; controls recover; retry retains completed resources.'); })().catch(error => { console.error(error); process.exitCode = 1; });
