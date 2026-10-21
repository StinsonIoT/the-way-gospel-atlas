const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('js/app.js', 'utf8');
let wroteLayout = false, readsAfterWrite = 0;
const read = value => { if (wroteLayout) readsAfterWrite++; return value; };
const section = (top, height, captionHeight) => ({
  get offsetTop() { return read(top); },
  get offsetHeight() { return read(height); },
  firstElementChild: {
    get offsetHeight() { return read(captionHeight); },
    style: { set top(value) { wroteLayout = true; this.value = value; } }
  }
});
const sections = [section(0, 1000, 400), section(1000, 900, 200), section(1900, 1000, 300), section(2900, 1200, 800)];
const context = vm.createContext({ sections, window: { innerWidth: 390, innerHeight: 844 },
  headBottom: () => read(66), getComputedStyle: () => ({ get paddingTop() { return read('32px'); } }) });
vm.runInContext('let tops = [], ends = [];\n' + source.slice(source.indexOf('function captionPin('), source.indexOf("if ('ResizeObserver' in window)")) + '\nmeasure(); this.targets = {tops, ends};', context);
assert.equal(readsAfterWrite, 0, 'measure all scene geometry before changing any caption layout');
assert.deepEqual(JSON.parse(JSON.stringify(context.targets)), { tops: [0, 1000, 1900, 2900], ends: [0, 1070, 2070, 3270] }, 'short and tall captions retain their scroll targets');
assert.deepEqual(sections.slice(1).map(s => s.firstElementChild.style.value), ['630px', '530px', '30px']);
console.log('PASS: scene measurement batches geometry reads before writes and preserves short/tall caption scroll targets.');
