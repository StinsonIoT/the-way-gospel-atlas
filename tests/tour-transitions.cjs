const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('js/app.js', 'utf8');
const timers = new Map(), events = {}; let clockId = 0, position = 0, finished = false;
const media = {
  dataset: { kind: 'idle' }, readyState: 1, paused: true, currentTime: 0,
  getAttribute: () => media.src,
  addEventListener: (name, fn) => { (events[name] ||= []).push(fn); },
  pause: () => { media.paused = true; (events.pause || []).forEach(fn => fn()); },
  play: () => { media.paused = false; (events.play || []).forEach(fn => fn()); return Promise.resolve(); }
};
const ctx = {
  window: {}, navigator: {}, document: { documentElement: { classList: { add() {} } } },
  tourEl: media, tourBar: {}, tTitle: {}, tSub: {}, tFill: { style: {} },
  tour: null, tourToken: 0, tourDwell: 0, sleepAt: 0,
  TS: { how: 'listen', rate: 1 },
  clearTimeout: id => timers.delete(id), setTimeout: (fn, delay) => { timers.set(++clockId, { fn, delay }); return clockId; },
  resetAudio() {}, queueDeclutter() {}, stepLabel: s => s.id,
  progress: () => position, glideTo: async i => { position = i; },
  setTourPlaying: on => { if (ctx.tour) ctx.tour.playing = on; },
  endTour: () => { finished = true; ctx.tour = null; },
  sleepOver: () => false, clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
  dwell: () => { ctx.sceneDone(); },
  tourNext: i => i + 1 < ctx.STEPS.length ? i + 1 : -1,
  tourRef: s => s.ref ? s.ref[0] : null,
  buildAudio: async label => ({ reader: 'souer', segs: label ? [{ url: 'first.mp3', start: 1, end: 3 }, { url: 'second.mp3', start: 2, end: 4 }] : [] }),
  refSpans: () => [], API_BOOK: {}, loadChapter: async () => ({})
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('js/scenes.js', 'utf8'), ctx);
ctx.STEPS = ctx.window.WAY.STEPS;
vm.runInContext(source.slice(source.indexOf('function watchAudioEnd('), source.indexOf('async function prepareAudio(')), ctx);
vm.runInContext(source.slice(source.indexOf('async function tourPlay('), source.indexOf('function dwell(')), ctx);
vm.runInContext(source.slice(source.indexOf('function sceneDone('), source.indexOf('function endTour(')), ctx);
vm.runInContext(source.slice(source.indexOf("tourEl.addEventListener('timeupdate'"), source.indexOf('const groupEnd =')), ctx);
(async () => {
  await ctx.tourPlay(1);
  for (let i = 1; i < ctx.STEPS.length; i++) {
    assert.equal(ctx.tour.i, i, 'tour reaches ' + ctx.STEPS[i].id);
    if (ctx.tour.segs.length) {
      assert(ctx.tour.playing, 'audio is playing at ' + ctx.STEPS[i].id);
      ctx.tourSegEnd(); assert.equal(ctx.tour.k, 1, 'chapter transition retains next segment');
      ctx.tourSegEnd();
      if (ctx.tour) {
        assert.equal(media.dataset.kind, 'done');
        assert(ctx.tour.playing, 'internal pause must not cancel the automatic next card');
        const count = timers.size; ctx.tourSegEnd();
        assert.equal(timers.size, count, 'duplicate end events do not schedule another transition');
      }
    }
    if (i < ctx.STEPS.length - 1) {
      const next = [...timers].find(([, t]) => t.delay === 900);
      assert(next, 'automatic next-card timer exists for ' + ctx.STEPS[i].id);
      timers.delete(next[0]); next[1].fn();
      await new Promise(resolve => setImmediate(resolve));
    }
  }
  assert(finished, 'tour reaches the closing state');
  console.log('PASS: all 89 playable cards advance automatically, chapter transitions retain playback, and duplicate end events do not double-advance.');
})().catch(err => { console.error(err); process.exitCode = 1; });
