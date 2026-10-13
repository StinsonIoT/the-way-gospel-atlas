const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

async function check(mode, url, quota = false, brokenRead = false) {
  const hooks = {}, lifetime = [];
  let completeWrite, writes = 0, deletions = 0, writtenBody;
  const networkResponse = new Response('network body');
  const ctx = { URL, setTimeout: () => 1,
    fetch: async () => networkResponse,
    caches: {
      match: async () => { if (brokenRead) throw Error('storage unavailable'); },
      open: async () => ({
        put: async (req, copy) => { writes++; if (quota) throw Error('quota'); await new Promise(resolve => { completeWrite = resolve; }); writtenBody = await copy.text(); },
        keys: async () => Array.from({ length: 902 }, (_, i) => 'tile-' + i),
        delete: async () => { deletions++; }
      })
    },
    self: { location: { origin: 'https://example.org' }, addEventListener: (name, fn) => { hooks[name] = fn; } }
  };
  vm.createContext(ctx); vm.runInContext(fs.readFileSync('sw.js', 'utf8'), ctx);
  let response;
  hooks.fetch({ request: { url, method: 'GET', mode, headers: { has: () => false } },
    respondWith: promise => { response = promise; }, waitUntil: promise => lifetime.push(promise) });
  assert(lifetime.length, 'cache writes must extend the fetch event lifetime');
  assert.equal(await response, networkResponse, 'cache persistence must not delay or replace the network response');
  assert.equal(await networkResponse.text(), 'network body', 'the caller can consume its response while the write is pending');
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(writes, 1);
  if (!quota) completeWrite();
  await Promise.all(lifetime);
  if (!quota) assert.equal(writtenBody, 'network body', 'cache receives an independently readable response clone');
  if (url.includes('/terrarium/') && !quota) assert.equal(deletions, 2, 'tile trimming finishes within the write lifetime');
}
(async () => {
  await check('cors', 'https://example.org/app.js');
  await check('navigate', 'https://example.org/');
  await check('cors', 'https://bible.helloao.org/api/BSB/MRK/1.json', true);
  await check('cors', 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/1/1/1.png');
  await check('cors', 'https://example.org/app.js', false, true);
  console.log('PASS: cache writes extend fetch lifetime; quota/read failures preserve network responses; tile trimming completes.');
})().catch(error => { console.error(error); process.exitCode = 1; });
