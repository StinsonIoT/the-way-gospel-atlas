const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('js/app.js', 'utf8');
const tick = () => new Promise(r => setImmediate(r));
async function localDeadline(body) {
  let timer;
  const ctx = { AbortController, setTimeout: fn => { timer = fn; return 1; }, clearTimeout: () => {}, API_BOOK: { john: 'JHN' }, BSB_LOCAL_V: 1,
    fetch: async (url, opts) => {
      const stalled = () => new Promise((resolve, reject) => opts.signal.addEventListener('abort', () => reject(Error('aborted'))));
      return body ? { ok: true, json: stalled } : stalled();
    } };
  vm.createContext(ctx);
  vm.runInContext(source.slice(source.indexOf('async function fetchJSON('), source.indexOf('const chapterCache')), ctx);
  vm.runInContext(source.slice(source.indexOf('const localBooks ='), source.indexOf('function loadChapter(')), ctx);
  const pending = ctx.loadLocalChapter('john', 14); await tick(); timer();
  await assert.rejects(pending, /aborted/);
  ctx.fetch = async () => ({ ok: true, json: async () => JSON.parse(fs.readFileSync('data/bsb/JHN.json', 'utf8')) });
  assert((await ctx.loadLocalChapter('john', 14)).savedCopy, 'saved-book retry recovers');
}
async function notesStop() {
  let resolve, count = 0;
  const ctx = { notesToken: 1, notesShown: -1, notesFor: [{ book: 'john', c1: 14, c2: 16 }], pNotes: { innerHTML: '' }, loadNotes: () => { count++; return new Promise(r => resolve = r); } };
  vm.createContext(ctx);
  vm.runInContext(source.slice(source.indexOf('async function showNotes('), source.indexOf('function showPassageTab(')), ctx);
  const first = ctx.showNotes(); await ctx.showNotes(); assert.equal(count, 1, 'duplicate tab clicks share pending work');
  ctx.notesToken++; resolve({ chapter: { content: [] } }); await first;
  assert.equal(count, 1, 'stale notes do not request the next chapter');
  ctx.loadNotes = async () => { throw Error('offline'); };
  await ctx.showNotes();
  assert.match(ctx.pNotes.innerHTML, /notes-retry/);
  ctx.loadNotes = async () => ({ chapter: { content: [] } });
  await ctx.showNotes();
  assert.match(ctx.pNotes.innerHTML, /No study notes/, 'failure resets pending state for retry');
}
async function audioStop() {
  let resolve, count = 0;
  const ctx = { passageToken: 1, READERS: ['souer'], URL, fetchJSON: () => { count++; return new Promise(r => resolve = r); }, aBar: { hidden: true }, audioBounds: () => ({ start: 0, end: 2 }) };
  vm.createContext(ctx);
  vm.runInContext(source.slice(source.indexOf('async function prepareAudio('), source.indexOf('function loadSeg(')), ctx);
  const sg = { json: { thisChapterAudioLinks: { souer: '/audio.mp3' }, thisChapterAudioTimings: { souer: '/timing.json' } }, from: 1, to: 2 };
  const pending = ctx.prepareAudio([sg, sg], 'John', 1);
  ctx.passageToken++; resolve({}); await pending;
  assert.equal(count, 1); assert(ctx.aBar.hidden, 'closing cannot reveal late audio controls');
}
(async () => { await localDeadline(false); await localDeadline(true); await notesStop(); await audioStop(); console.log('PASS: main reader saved-book deadlines/retry, pending-note sharing, and stale notes/audio cancellation.'); })().catch(err => { console.error(err); process.exitCode = 1; });
