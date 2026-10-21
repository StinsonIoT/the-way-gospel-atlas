const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');
const source = fs.readFileSync('js/app.js', 'utf8');

function loader() {
  const requests = [];
  const context = vm.createContext({
    AbortController, DOMException, Map, Int16Array,
    DEM_URL: 'https://fixture/{z}/{x}/{y}',
    fetch(url, options = {}) {
      return new Promise((resolve, reject) => {
        requests.push({ signal: options.signal, resolve });
        options.signal?.addEventListener('abort', () => reject(options.signal.reason), { once: true });
      });
    },
    createImageBitmap: async () => ({ width: 1, height: 1, close() {} }),
    lookCanvas: () => ({ getContext: () => ({ drawImage() {}, getImageData: () => ({ data: [128, 0, 0, 255] }) }) })
  });
  vm.runInContext(source.slice(source.indexOf('const demCache ='), source.indexOf('const lookCanvas =')), context);
  return { context, requests, tile: (signal) => context.demTile(7, 76, 52, signal) };
}

test('canceling the last tile consumer aborts the network request and allows retry', async () => {
  const { requests, tile } = loader(), controller = new AbortController();
  const result = tile(controller.signal);
  const rejected = assert.rejects(result, { name: 'AbortError' });
  controller.abort();
  assert.equal(requests[0].signal?.aborted, true, 'obsolete tile fetch must be canceled');
  await rejected;
  const retry = tile();
  assert.equal(requests.length, 2, 'canceled cache entry must not poison retries');
  requests[1].resolve({ ok: true, blob: async () => ({}) });
  await retry;
});

test('one canceled consumer does not cancel terrain still needed by another layer', async () => {
  const { requests, tile } = loader(), first = new AbortController(), second = new AbortController();
  const a = tile(first.signal), b = tile(second.signal);
  const rejected = assert.rejects(a, { name: 'AbortError' });
  first.abort();
  assert.equal(requests.length, 1, 'relief and depth share one download');
  assert.equal(requests[0].signal?.aborted, false);
  requests[0].resolve({ ok: true, blob: async () => ({}) });
  await rejected;
  assert.equal((await b).h[0], 0);
});

for (const handler of ['reliefTile', 'depthTile']) {
  test(`${handler} forwards MapLibre cancellation to the terrain loader`, async () => {
    const { context, requests } = loader(), controller = new AbortController();
    context.tileOf = () => [7, 76, 52];
    context.lookRings = { fine: Promise.resolve([]), wide: Promise.resolve([]) };
    const end = handler === 'reliefTile' ? 'const DEPTH_RAMP =' : 'if (LOOK) { maplibregl.addProtocol';
    vm.runInContext(source.slice(source.indexOf(`async function ${handler}(`), source.indexOf(end)), context);
    const result = context[handler]({ url: 'atlasdepth://fine/7/76/52' }, controller);
    const rejected = assert.rejects(result, { name: 'AbortError' });
    controller.abort();
    assert.equal(requests[0].signal?.aborted, true);
    await rejected;
  });
}

test('coast mask choice follows its water layer even for parent tiles', async () => {
  const selected = [];
  const context = vm.createContext({
    tileOf: () => [6, 38, 26],
    demTile: async () => ({ w: 1, h: [0] }),
    lookRings: {
      fine: { then(resolve) { selected.push('fine'); resolve([]); } },
      wide: { then(resolve) { selected.push('wide'); resolve([]); } }
    },
    DEPTH_FINE_FROM: 7,
    lookCanvas: () => ({ getContext: () => ({ beginPath() {}, fill() {}, getImageData: () => ({ data: [0, 0, 0, 0] }) }) }),
    lookPng: async () => ({ data: new ArrayBuffer(0) })
  });
  vm.runInContext(source.slice(source.indexOf('async function depthTile('), source.indexOf('if (LOOK) { maplibregl.addProtocol')), context);
  await context.depthTile({ url: 'atlasdepth://fine/6/38/26' });
  await context.depthTile({ url: 'atlasdepth://wide/6/38/26' });
  assert.deepEqual(selected, ['fine', 'wide'], 'parent tiles must retain the outline of the layer they belong to');
});

test('water fills and depth masks switch together at fractional map zooms', () => {
  const context = vm.createContext({ LOOK: true, DEPTH_FINE_FROM: 7, LOOK_TILE_SIZE: 512 });
  vm.runInContext(source.slice(source.indexOf('const lookSources ='), source.indexOf('const map = new maplibregl.Map'))
    + '\nthis.sources = lookSources; this.layers = lookWaterLayers;', context);
  for (const [zoom, expected] of [[6.4, 'wide'], [6.9, 'wide'], [7, 'fine'], [7.5, 'fine']]) {
    const visible = context.layers.filter(l => zoom >= (l.minzoom ?? 0) && zoom < (l.maxzoom ?? 24));
    const fill = visible.find(l => l.type === 'fill');
    const depths = visible.filter(l => l.type === 'raster');
    assert.equal(depths.length, 1, `one depth layer at zoom ${zoom}`);
    assert.equal(fill.source, expected === 'wide' ? 'seacoverwide' : 'seacover');
    assert(context.sources[depths[0].source].tiles[0].startsWith(`atlasdepth://${expected}/`), `matching mask at zoom ${zoom}`);
  }
});
