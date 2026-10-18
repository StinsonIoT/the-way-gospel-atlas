const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('js/app.js', 'utf8');
let cssWrites = 0, paintWrites = 0, geometryWrites = 0;
const ctx = { window: {}, exploring: false, markerEls: {}, AREAS: {}, ROUTES: {}, ZONES: {}, overlay: {}, hasContours: false,
  root: { setProperty: () => cssWrites++ }, document: { body: { style: {} } }, exploreBtn: { style: {} },
  experience: { visible: s => s.show, primary: () => [] }, reduceMotion: false, TRAVEL_HOLD: .12,
  queueDeclutter() {},
  map: { setFilter() {}, setPaintProperty: () => paintWrites++, setLayoutProperty() {}, getSource: () => ({ setData: () => geometryWrites++ }) }
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('js/scenes.js', 'utf8'), ctx);
ctx.PALETTES = ctx.window.WAY.PALETTES;
vm.runInContext(source.slice(source.indexOf('const clamp ='), source.indexOf('const routePts =')), ctx);
vm.runInContext(source.slice(source.indexOf('let romeOn ='), source.indexOf('let queued =')), ctx);
const a = { id: 'a', pal: 'day', show: [] }, b = { id: 'b', pal: 'day', show: [] };
ctx.apply(a, b, .1, 1.2);
const first = { cssWrites, paintWrites, geometryWrites };
ctx.apply(a, b, .1, 1.2);
assert.deepEqual({ cssWrites, paintWrites, geometryWrites }, first, 'holding a scene performs no repeated styling or geometry work');
ctx.apply(a, b, .2, 1.3);
assert.equal(cssWrites, first.cssWrites, 'moving between scenes with identical light does not rewrite global styles');
ctx.apply(a, { ...b, pal: 'night' }, .9, 1.9);
assert(cssWrites > first.cssWrites, 'a genuine light change still updates the page');
console.log('PASS: held scenes skip repeated work; matching palettes avoid global style writes; lighting changes still render.');

// Moving a label to the opposite side must use the measured rectangle without
// a write/read cycle that forces layout for every label.
{
  let wrote = false;
  const classes = new Set(['mk-right']);
  const read = rect => { assert(!wrote, 'all label layout reads precede DOM writes'); return rect; };
  const marker = { _op: '1', style: {},
    classList: { contains: name => classes.has(name), remove: (...names) => { wrote = true; names.forEach(n => classes.delete(n)); }, add: name => { wrote = true; classes.add(name); }, toggle: (name, on) => { wrote = true; on ? classes.add(name) : classes.delete(name); } },
    getBoundingClientRect: () => read({ left: 80 }),
    querySelector: selector => ({ getBoundingClientRect: () => read(selector === '.lbl' ? { left: 93, right: 123, top: 45, bottom: 55 } : { left: 75, right: 85, top: 45, bottom: 55 }) })
  };
  const env = { markerEls: { town: marker }, PLACES: { town: { type: 'named' } }, performance: { now: () => 0 },
    window: { innerWidth: 100, innerHeight: 100 }, progress: () => 0, exploring: true,
    document: { querySelector: () => ({ getBoundingClientRect: () => read({ bottom: 10 }) }), querySelectorAll: () => [] }, map: { on() {} } };
  vm.createContext(env);
  vm.runInContext(source.slice(source.indexOf('const RANK ='), source.indexOf('// ---------- cameras')), env);
  env.declutter();
  assert(classes.has('mk-left') && !classes.has('clash'), 'edge label flips into view instead of disappearing');
  console.log('PASS: labels flip correctly with all layout reads batched before class writes.');
}

// Captions still move while the camera holds: collision checks cannot depend
// only on camera or palette changes.
{
  let collisions = 0;
  const env = { N: 2, cams: [{ x: 0, y: 0, zoom: 1 }, { x: 0, y: 0, zoom: 1 }], STEPS: [{ id: 'a' }, { id: 'b' }],
    progress: () => 0, storyModels() {}, sections: [{ firstElementChild: { getBoundingClientRect: () => ({ top: 100 }) } }],
    exploreBtn: { offsetTop: 0, offsetHeight: 0, classList: { toggle() {} } }, TRAVEL_HOLD: .12, reduceMotion: false,
    experience: { mixPadding: () => ({}), stage: () => '' },
    maplibregl: { MercatorCoordinate: class { toLngLat() { return [0, 0]; } } }, lerpAngle: () => 0,
    map: { jumpTo() {} }, syncElevation() {}, apply() {}, queueDeclutter: () => collisions++,
    frameState: { opening: true, moment: 'a', leaving: -1 }, document: { getElementById: () => ({ hidden: true, textContent: '' }) },
    updateTimeline() {}, noteStep() {}, chapterEl: {}, lastCh: '', window: {} };
  vm.createContext(env);
  vm.runInContext(source.slice(source.indexOf('const clamp ='), source.indexOf('const routePts =')), env);
  vm.runInContext(source.slice(source.indexOf('let exploring = false;'), source.indexOf('// Territory colours')), env);
  env.render(); env.render();
  assert.equal(collisions, 2, 'held scene scroll frames still schedule throttled collision checks');
}

// A temporary model failure must not leave a stationary map without buildings.
(async () => {
  const timers = []; let now = 0, attempts = 0, loaded = null;
  const env = { performance: { now: () => now }, fetchJSON: async () => { if (++attempts === 1) throw Error('temporary failure'); return { features: ['building'] }; },
    setTimeout: (fn, delay) => { timers.push({ fn, delay }); }, map: { getSource: () => ({ setData: data => { loaded = data; } }) },
    N: 1, STEPS: [{ plan: 1 }], exploring: false, progress: () => 0, navigator: { onLine: true }, window: { addEventListener() {} } };
  vm.createContext(env);
  vm.runInContext(source.slice(source.indexOf('const modelLoads ='), source.indexOf("map.on('moveend', () => { if (exploring)")), env);
  env.ensureModel('city3d');
  await new Promise(resolve => setImmediate(resolve));
  assert(timers.length > 0, 'failed model schedules recovery without requiring another map movement');
  now = 9000; timers[0].fn();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(loaded.features[0], 'building', 'scheduled retry installs the model in the stationary scene');
  console.log('PASS: failed model loads schedule a retry for the current view.');
})().catch(error => { console.error(error); process.exitCode = 1; });
