const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const app = fs.readFileSync('js/app.js', 'utf8');

async function checkTimeout() {
  let timeout, requests = 0, cleared = 0;
  const ctx = { AbortController, setTimeout: fn => { timeout = fn; return 1; }, clearTimeout: () => cleared++,
    fetch: (url, options) => { requests++; return new Promise((resolve, reject) => options?.signal?.addEventListener('abort', () => reject(Error('aborted')))); }, API_BOOK: { mark: 'MRK' } };
  vm.createContext(ctx);
  const helper = app.indexOf('async function fetchJSON(');
  if (helper >= 0) vm.runInContext(app.slice(helper, app.indexOf('const chapterCache', helper)), ctx);
  vm.runInContext(app.slice(app.indexOf('const notesCache'), app.indexOf('function noteHTML')), ctx);
  const pending = ctx.loadNotes('mark', 1);
  assert.equal(typeof timeout, 'function', 'notes requests must have a deadline');
  timeout();
  await assert.rejects(pending, /aborted/);
  assert.equal(cleared, 1, 'deadline cleaned up after failure');
  ctx.fetch = async () => ({ ok: true, status: 200, json: async () => ({ chapter: { content: [] } }) });
  const retry = await ctx.loadNotes('mark', 1);
  assert(retry.chapter, 'a failed notes request permits a fresh request');
  assert.equal(requests, 1);
  ctx.fetch = async () => ({ ok: false, status: 404 });
  assert.equal(await ctx.loadNotes('mark', 2), null, 'missing notes are not a network error');
}
async function checkBodyTimeout() {
  let timeout;
  const ctx = { AbortController, setTimeout: fn => { timeout = fn; return 1; }, clearTimeout: () => {},
    fetch: async (url, options) => ({ ok: true, json: () => new Promise((resolve, reject) => options.signal.addEventListener('abort', () => reject(Error('body aborted')))) }) };
  vm.createContext(ctx);
  vm.runInContext(app.slice(app.indexOf('async function fetchJSON('), app.indexOf('const chapterCache')), ctx);
  const pending = ctx.fetchJSON('https://example.org/stalled-body');
  await new Promise(resolve => setImmediate(resolve));
  timeout();
  await assert.rejects(pending, /body aborted/, 'deadline includes reading the response body');
}
(async () => { await checkTimeout(); await checkBodyTimeout(); console.log('PASS: notes deadline, cleanup, retry, missing-note behavior, and stalled JSON body.'); })().catch(error => { console.error(error); process.exitCode = 1; });
