const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('js/app.js', 'utf8');
const flush = () => new Promise(resolve => setImmediate(resolve));

// Canceling a chapter must stop its request without starting the local fallback;
// a new reader of that same chapter must still be able to load it.
async function chapters() {
  const requests = [];
  const ctx = { AbortController, setTimeout, clearTimeout, API_BOOK: { mark: 'MRK' },
    fetch: (url, options) => new Promise((resolve, reject) => {
      requests.push({ url, resolve });
      options?.signal?.addEventListener('abort', () => reject(options.signal.reason));
    }) };
  vm.createContext(ctx);
  vm.runInContext(source.slice(source.indexOf('async function fetchJSON('), source.indexOf('function verseHTML(')), ctx);
  const ctl = new AbortController();
  const pending = ctx.loadChapter('mark', 1, ctl.signal);
  const outcome = pending.then(() => 'resolved', () => 'canceled');
  ctl.abort();
  await flush();
  assert.equal(requests.length, 1, 'canceled chapter must not start a saved-copy request');
  assert.equal(await Promise.race([outcome, flush().then(() => 'waiting')]), 'canceled', 'chapter cancellation settles promptly');
  const retry = ctx.loadChapter('mark', 1, new AbortController().signal);
  await flush();
  assert.equal(requests.length, 2, 'retry gets a fresh request');
  requests[1].resolve({ ok: true, json: async () => ({ translation: { id: 'BSB' }, chapter: { content: [{ type: 'verse', number: 1 }] } }) });
  assert((await retry).chapter);
}

async function timings() {
  let activeSignal;
  const ctx = { AbortController, setTimeout, clearTimeout, URL,
    refSpans: () => [{ book: 'mark', c1: 1, c2: 2 }], API_BOOK: { mark: 'MRK' }, TS: {}, READERS: ['hays'],
    loadChapter: async () => ({ thisChapterAudioLinks: { hays: 'recording.mp3' }, thisChapterAudioTimings: { hays: '/timing.json' } }),
    fetch: (url, options) => { activeSignal = options.signal; return new Promise((resolve, reject) => options.signal.addEventListener('abort', () => reject(options.signal.reason))); }
  };
  vm.createContext(ctx);
  vm.runInContext(source.slice(source.indexOf('async function fetchJSON('), source.indexOf('const chapterCache')), ctx);
  vm.runInContext(source.slice(source.indexOf('async function buildAudio('), source.indexOf('// iPhone only lets')), ctx);
  const ctl = new AbortController();
  const pending = ctx.buildAudio('Mark 1–2', ctl.signal);
  await flush();
  ctl.abort();
  assert(activeSignal.aborted, 'stopping playback aborts the pending timing request');
  await assert.rejects(pending, { name: 'AbortError' }, 'cancellation must not become whole-chapter playback');
}
(async () => { await chapters(); await timings(); console.log('PASS: canceled chapters and timings stop promptly, avoid fallback playback, and allow retry.'); })().catch(error => { console.error(error); process.exitCode = 1; });
