const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const values = new Map();
const storage = { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
const ctx = { window: { localStorage: storage } }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync('js/listening.js', 'utf8'), ctx);
const listening = ctx.window.WAY_LISTEN;
const scenes = [{ id: 'title' }, { id: 'voice' }, { id: 'trials' }, { id: 'finished' }];
const bookmark = { v: 1, scene: 'trials', end: 'finished', follow: 'mk', ref: 'Mark 14:53–15:15', settings: { reader: 'souer', rate: 1.25, len: 'full' }, segment: { id: 'mark:15:1:15', start: 240, end: 310, offset: 17.375 } };
const plain = value => JSON.parse(JSON.stringify(value));
assert(listening.write(bookmark, scenes));
assert.deepEqual(plain(listening.read(scenes)), bookmark, 'scene, narrator, speed, Gospel, range and chapter position survive reload');
const segments = [{ id: 'mark:14:53:999', start: 100, end: null }, { id: 'mark:15:1:15', start: 240, end: 310 }];
assert.deepEqual(plain(listening.position(bookmark, segments, 'souer', bookmark.ref)), { index: 1, time: 257.375, restored: true }, 'resume finds the correct chapter and exact position');
assert.equal(listening.position(bookmark, segments, 'hays', bookmark.ref).restored, false, 'another narrator must not receive the old position');
assert.equal(listening.position(bookmark, [{ id: 'mark:15:1:15', start: 0, end: null }], 'souer', bookmark.ref).restored, false, 'whole-chapter fallback must not reuse verse-relative offsets');
assert.equal(listening.position(bookmark, segments, 'souer', 'Mark 15:1').restored, false, 'changed readings start at their own beginning');
assert(listening.position({ ...bookmark, segment: { ...bookmark.segment, offset: 1000 } }, segments, 'souer', bookmark.ref).time < 310, 'restored playback stays inside the selected passage');
for (const invalid of [null, { ...bookmark, v: 2 }, { ...bookmark, scene: 'unknown' }, { ...bookmark, end: 'voice' }, { ...bookmark, settings: { ...bookmark.settings, rate: 99 } }, { ...bookmark, segment: { ...bookmark.segment, offset: -1 } }, { ...bookmark, segment: { ...bookmark.segment, offset: Infinity } }]) {
  assert.equal(listening.validate(invalid, scenes), null, 'invalid bookmarks cannot restore playback');
}
listening.clear(); assert.equal(listening.read(scenes), null);
values.set('the-way:listening', '{broken json'); assert.equal(listening.read(scenes), null);
Object.defineProperty(ctx.window, 'localStorage', { get: () => { throw Error('storage denied'); } });
assert.equal(listening.read(scenes), null); assert.equal(listening.write(bookmark, scenes), false); listening.clear();
console.log('PASS: listening bookmarks persist, match chapters/narrators/readings, clamp seeks, and tolerate corrupt or unavailable storage.');
