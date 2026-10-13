const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('js/app.js', 'utf8');
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync('js/audio-boundaries.js', 'utf8'), ctx);
vm.runInContext(source.slice(source.indexOf('function audioBounds('), source.indexOf('async function prepareAudio(')), ctx);
const chapter = numbers => ({ chapter: { content: numbers.map(number => ({ type: 'verse', number })) } });
const bounds = (numbers, times, from, to) => JSON.parse(JSON.stringify(ctx.audioBounds(chapter(numbers), { verses: times }, from, to)));
assert.deepEqual(bounds([1, 2, 3], [2, 5, 9], 1, 2), { start: 2, end: 9 });
assert.deepEqual(bounds([1, 2, 3, 5, 6, 7, 8, 9, 10], [1, 2, 3, 5, 6, 7, 8, 9, 10], 5, 9), { start: 5, end: 10 });
assert.deepEqual(bounds([1, 2, 3, 5, 6], [10, 20, 30, 50, 60], 3, 5), { start: 30, end: 60 });
assert.deepEqual(bounds([1, 2, 3, 5, 6], [10, 20, 30, 50, 60], 5, 999), { start: 50, end: null });
assert.deepEqual(bounds([1, 2, 3, 5, 6], [10, 20, 30, 40, 50, 60], 5, 5), { start: 50, end: 60 });
assert.equal(bounds([1, 2, 3, 5, 6], [10, 20, 30, 50, 60], 4, 4), null);
assert.throws(() => ctx.audioBounds(chapter([1, 2, 3]), { verses: [1, 2] }, 1, 2), /Unexpected/);
assert.throws(() => ctx.audioBounds(chapter([1, 2, 3]), { verses: [1, 0, 3] }, 1, 2), /Invalid/);
assert.throws(() => ctx.audioBounds(chapter([1, 2, 3]), { verses: [1, '2', 3] }, 1, 2), /Invalid/);
const opening = chapter([1, 2, 3, 4, 5, 6]);
const souer = { translationId: 'BSB', bookId: 'JHN', chapterNumber: 1, reader: 'souer', verses: [5.368, 10.993, 13.456, 19.561, 23.445, 28.725] };
assert.equal(ctx.audioBounds(opening, souer, 1, 1).end, 10.85);
assert.equal(ctx.audioBounds(opening, souer, 1, 5).end, 28.575);
assert.equal(ctx.audioBounds(opening, { ...souer, reader: 'hays' }, 1, 5).end, 28.725);
assert.equal(ctx.audioBounds(opening, { ...souer, verses: [5, 10, 13, 19, 23, 29] }, 1, 5).end, 29);

// End timers must respond to the media clock, pause, seeking and playback rate.
{
  const callbacks = {}, timers = new Map(); let seq = 0, finished = 0;
  const clock = { setTimeout: (fn, ms) => { timers.set(++seq, { fn, ms }); return seq; }, clearTimeout: id => timers.delete(id) };
  const env = { ...clock }; vm.createContext(env);
  vm.runInContext(source.slice(source.indexOf('function watchAudioEnd('), source.indexOf('async function prepareAudio(')), env);
  const media = { paused: false, seeking: false, currentTime: 8, playbackRate: 2, addEventListener: (event, fn) => { callbacks[event] = fn; } };
  env.watchAudioEnd(media, () => ({ end: 10 }), () => finished++);
  callbacks.playing(); assert.equal([...timers.values()][0].ms, 1000);
  let timer = [...timers.values()][0]; timers.clear(); timer.fn();
  assert.equal(finished, 0, 'buffering does not advance the media clock');
  media.paused = true; callbacks.pause(); assert.equal(timers.size, 0);
  media.paused = false; media.seeking = true; callbacks.seeking(); assert.equal(timers.size, 0);
  media.seeking = false; media.currentTime = 9.96; callbacks.seeked();
  assert(Math.abs([...timers.values()][0].ms - 20) < 0.001);
  timer = [...timers.values()][0]; timers.clear(); media.currentTime = 10; timer.fn(); assert.equal(finished, 1);
}

function checkStop(player) {
  const callbacks = {}; let stopped = 0;
  const media = { dataset: { kind: 'tour' }, currentTime: 9.96, duration: 20, addEventListener: (name, fn) => { callbacks[name] = fn; } };
  const sg = { start: 1, end: 10 };
  const env = player === 'tour' ? { tourEl: media, tour: { segs: [sg], k: 0 }, tourSegEnd: () => stopped++, sleepAt: 0, tFill: { style: {} }, clamp: (v, a, b) => Math.max(a, Math.min(b, v)) }
    : { audioEl: media, aSegs: [sg], aIdx: 0, nextSeg: () => stopped++, aFill: { style: {} } };
  vm.createContext(env);
  const variable = player === 'tour' ? 'tourEl' : 'audioEl';
  const start = source.indexOf(`${variable}.addEventListener('timeupdate'`);
  const end = source.indexOf(`${variable}.addEventListener('ended'`, start);
  vm.runInContext(source.slice(start, end), env);
  callbacks.timeupdate(); assert.equal(stopped, 0, player + ' keeps the last fraction of the verse');
  media.currentTime = 10; callbacks.timeupdate(); assert.equal(stopped, 1, player + ' stops at the actual boundary');
}
checkStop('tour'); checkStop('passage');

// Exercise the real tour builder across a chapter break, including a gap.
(async () => {
  Object.assign(ctx, {
    TS: { reader: 'souer' }, READERS: ['souer'], API_BOOK: { mark: 'MRK' }, URL, AbortController, setTimeout, clearTimeout,
    refSpans: () => [{ book: 'mark', c1: 14, v1: 3, c2: 15, v2: 2 }],
    loadChapter: async (book, n) => ({ ...chapter(n === 14 ? [1, 2, 3, 5] : [1, 2, 3]), thisChapterAudioLinks: { souer: `https://example.org/${n}.mp3` }, thisChapterAudioTimings: { souer: `/${n}.json` } }),
    fetch: async url => ({ ok: true, json: async () => ({ verses: url.endsWith('/14.json') ? [1, 2, 3, 5] : [10, 20, 30] }) })
  });
  vm.runInContext(source.slice(source.indexOf('async function fetchJSON('), source.indexOf('const chapterCache')), ctx);
  vm.runInContext(source.slice(source.indexOf('async function buildAudio('), source.indexOf('// iPhone only lets audio start')), ctx);
  const result = await ctx.buildAudio('Mark 14:3–15:2');
  assert.deepEqual(JSON.parse(JSON.stringify(result.segs)), [{ url: 'https://example.org/14.mp3', start: 3, end: null }, { url: 'https://example.org/15.mp3', start: 10, end: 30 }]);
  ctx.TS.reader = 'gilbert';
  ctx.loadChapter = async (book, n) => ({ ...chapter([1, 2, 3]), thisChapterAudioLinks: n === 14 ? { gilbert: 'https://example.org/gilbert.mp3' } : {} });
  const missing = await ctx.buildAudio('Mark 14:3–15:2');
  assert.equal(missing.wholeChapter, true, 'missing verse timings expose the whole-chapter fallback');
  assert.equal(missing.partial, true, 'missing later recording exposes partial passage audio');
  assert.equal(missing.segs.length, 1);
  // Key readings must not leave a hanging comma/colon at a verse boundary.
  ctx.norm = s => String(s).toLowerCase();
  vm.runInContext(fs.readFileSync('js/tour.js', 'utf8'), ctx);
  vm.runInContext(source.slice(source.indexOf('const BOOKS ='), source.indexOf('const stepSpans =')), ctx);
  vm.runInContext(source.slice(source.indexOf('const API_BOOK ='), source.indexOf('const HUB_BOOK')), ctx);
  for (const [scene, label] of Object.entries(ctx.window.WAY_KEY)) {
    const sp = ctx.refSpans(label).at(-1);
    const code = vm.runInContext('API_BOOK', ctx)[sp.book];
    const content = JSON.parse(fs.readFileSync('data/bsb/' + code + '.json', 'utf8')).chapters[sp.c2];
    const verse = content.filter(v => v.type === 'verse' && v.number <= sp.v2).at(-1);
    const text = verse.content.map(v => typeof v === 'string' ? v : v.text || '').join('');
    assert(!/[,:;]\s*["\u201d\u2019]*$/.test(text), scene + ' ends in the middle of a sentence: ' + label);
  }
  assert.equal(ctx.window.WAY_KEY.visitation, 'Luke 1:41–55', 'Mary\'s song finishes before the next card');
  console.log('PASS: verse gaps, first/last verses, chapter transitions, invalid timings, and both players stopping at the actual boundary.');
})().catch(err => { console.error(err); process.exitCode = 1; });
