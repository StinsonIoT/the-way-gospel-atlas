// The reviewed sources are shared by the web app and export-ios-content.cjs.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'), context = { window: {} };
vm.createContext(context);
for (const file of ['scenes', 'study', 'guide', 'places']) vm.runInContext(fs.readFileSync(path.join(root, 'js/' + file + '.js'), 'utf8'), context);
const { WAY, WAY_PLAN, WAY_PEOPLE, WAY_TOPICS, WAY_OT } = context.window;
const ids = new Set();
for (const scene of WAY.STEPS) {
  assert(/^[a-z0-9-]+$/.test(scene.id) && !ids.has(scene.id), 'Unique stable scene ID: ' + scene.id); ids.add(scene.id);
  assert(typeof scene.ch === 'string' && Array.isArray(scene.show), scene.id + ': chapter and map selection');
  if (scene.ref) assert(typeof scene.ref[0] === 'string' && typeof scene.ref[1] === 'string' && Number.isInteger(scene.ref[2]) && scene.ref[2] > 0, scene.id + ': Scripture reference');
}
assert.equal(WAY_PLAN.length, 30);
const planned = [];
for (const [title, scenes] of WAY_PLAN) { assert(title && scenes.length); for (const id of scenes) { assert(ids.has(id) && id !== 'title', title + ': known scene ' + id); planned.push(id); } }
assert.equal(new Set(planned).size, planned.length, 'No scene appears in more than one plan day');
assert.deepEqual(Array.from(planned), Array.from(WAY.STEPS.slice(1), s => s.id), 'The plan preserves the complete story order');
for (const person of WAY_PEOPLE || []) for (const id of person.scenes) assert(ids.has(id), person.id + ': known scene ' + id);
for (const topic of WAY_TOPICS || []) if (Array.isArray(topic.items)) for (const item of topic.items) assert(ids.has(item[0]), topic.id + ': known scene ' + item[0]);
for (const [id, links] of Object.entries(WAY_OT || {})) { assert(ids.has(id)); for (const link of links) assert(link.nt && link.ot && link.note, id + ': sourced Scripture relationship'); }
console.log('PASS: shared content IDs, Scripture references, people, topics, Old Testament links, and all 30 plan days are valid.');
