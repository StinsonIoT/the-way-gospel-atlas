const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('js/reader-lite.js', 'utf8');
const tick = () => new Promise(resolve => setImmediate(resolve));
function setup(fetch) {
  const timers = new Map(); let id = 0;
  const ctx = { Map, AbortController, fetch, setTimeout: fn => { timers.set(++id, fn); return id; }, clearTimeout: n => timers.delete(n) };
  vm.createContext(ctx);
  vm.runInContext(source.slice(source.indexOf('const cache ='), source.indexOf('function verseHTML')), ctx);
  return { ctx, timers };
}
async function deadlines(body) {
  let calls = 0;
  const { ctx, timers } = setup(async (url, opts) => {
    calls++;
    if (url.startsWith('https:')) throw Error('offline');
    const stalled = () => new Promise((resolve, reject) => opts.signal.addEventListener('abort', () => reject(Error('aborted'))));
    return body ? { ok: true, json: stalled } : stalled();
  });
  let pending = ctx.getText('JHN', 1);
  await tick(); assert.equal(timers.size, 1);
  [...timers.values()][0](); await assert.rejects(pending, /aborted/);
  assert.equal(timers.size, 0);
  ctx.fetch = async url => { calls++; return { ok: true, json: async () => JSON.parse(fs.readFileSync('data/bsb/JHN.json', 'utf8')) }; };
  const recovered = await ctx.getText('JHN', 1);
  assert(recovered.savedCopy); assert(recovered.chapter.content.length);
  assert(calls >= 4, 'both failed API and saved-book entries allow retry');
}
async function stopsAfterClose(notes) {
  let resolve, requests = 0;
  const target = { innerHTML: 'unchanged' };
  const ctx = { token: 1, notesFor: -1, current: [{ book: 'JHN', c1: 14, c2: 17, v1: 1, v2: 999 }], textEl: target, notesEl: target,
    esc: s => s, verseHTML: () => '', getText: () => { requests++; return new Promise(r => resolve = r); }, get: () => { requests++; return new Promise(r => resolve = r); } };
  vm.createContext(ctx);
  vm.runInContext(source.slice(source.indexOf('async function loadText('), source.indexOf('function tab(')), ctx);
  const pending = notes ? ctx.loadNotes(1) : ctx.loadText(1);
  ctx.token = 2; resolve({ chapter: { content: [] } }); await pending;
  assert.equal(requests, 1, 'closing or replacing a passage stops remaining chapter requests');
  assert.equal(target.innerHTML, 'unchanged', 'stale requests cannot replace the current panel');
}
(async () => {
  await deadlines(false); await deadlines(true);
  await stopsAfterClose(false); await stopsAfterClose(true);
  console.log('PASS: guide saved-text header/body deadlines, retry, and stale text/notes chapter cancellation.');
})().catch(err => { console.error(err); process.exitCode = 1; });
