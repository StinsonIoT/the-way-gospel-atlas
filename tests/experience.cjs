const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const cp = require('node:child_process');
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync('js/scenes.js', 'utf8'), ctx);
vm.runInContext(fs.readFileSync('js/experience.js', 'utf8'), ctx);
vm.runInContext(fs.readFileSync('js/study.js', 'utf8'), ctx);
const ex = ctx.window.WAY_EXPERIENCE, steps = ctx.window.WAY.STEPS;
assert.equal(steps.length, 90);
// Content files are edited after review; the scenes themselves (ids and order)
// and the 3D models must stay as they were at the baseline.
{
  const base = { window: {} }; vm.createContext(base);
  vm.runInContext(cp.execFileSync('git', ['show', '4b074cce54e39b69467c76a90ca086824de3b7e3:js/scenes.js']).toString(), base);
  assert.equal(JSON.stringify(steps.map(s => s.id)), JSON.stringify(base.window.WAY.STEPS.map(s => s.id)), 'all 90 scenes keep their ids and order');
}
for (const file of ['data/jerusalem3d.json', 'data/capernaum3d.json']) {
  assert.equal(Buffer.compare(fs.readFileSync(file), cp.execFileSync('git', ['show', '4b074cce54e39b69467c76a90ca086824de3b7e3:' + file])), 0, file + ' must retain the original content');
}
// Expanded captions and additional header bars leave valid camera space.
for (const [w,h] of [[320,568],[390,720],[430,932],[844,390],[768,1024],[1440,900]]) {
  for (const height of [180,360,650]) for (const header of [66,130,180]) {
    const p = ex.padding(w,h,height,Math.min(w-24,430),header);
    Object.values(p).forEach(v => assert(Number.isFinite(v) && v >= 0));
    assert(p.top+p.bottom < h, 'positive vertical camera window');
    assert(p.left+p.right < w, 'positive horizontal camera window');
    assert.deepEqual(JSON.parse(JSON.stringify(ex.mixPadding(p,p,1))),JSON.parse(JSON.stringify(p)));
  }
}
const opening = ex.view(steps[0]), star = ctx.window.WAY.PLACES.star;
assert(star.lng > opening[0][0] && star.lng < opening[1][0] && star.lat > opening[0][1] && star.lat < opening[1][1]);
for (const id of ['entry','temple','upper','pray','golgotha','burial','risen']) assert.equal(ex.bearing(id,34),-16);
assert.equal(ex.bearing('firstday',14),14);assert.equal(ex.hold('title'),.18);assert.equal(ex.hold('pray'),.5);assert.equal(ex.hold('firstday'),.35);
// Execute the real markup functions, checking retained text and actions.
const app=fs.readFileSync('js/app.js','utf8');
Object.assign(ctx,{experience:ex,PALETTES:ctx.window.WAY.PALETTES,CHIPS:ctx.window.WAY.CHIPS});
vm.runInContext(app.slice(app.indexOf('const esc ='),app.indexOf('const SYM =')),ctx);
vm.runInContext(app.slice(app.indexOf('const SYM ='),app.indexOf('const ASK =')),ctx);
vm.runInContext(app.slice(app.indexOf('const HARM ='),app.indexOf('const LEGEND =')),ctx);
ctx.whenHTML=()=>'';ctx.legendHTML='legend';
vm.runInContext(app.slice(app.indexOf('function cardHTML('),app.indexOf('STEPS.forEach((s, i) =>')),ctx);
for(const s of steps){const html=ctx.cardHTML(s),plain=html.replace(/<[^>]*>/g,'').replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&lt;','<').replaceAll('&gt;','>');if(s.text)assert(plain.includes(s.text),s.id+' summary retained');if(s.note)assert(plain.includes(s.note),s.id+' note retained');if(s.verse)assert(plain.includes(s.verse),s.id+' quote retained');}
const title=ctx.cardHTML(steps[0]);assert(title.includes('data-story-jump="word"')&&title.includes('data-tour-setup')&&title.includes('data-explore="land"')&&title.includes('id="resume"'));
const upper=ctx.cardHTML(steps.find(s=>s.id==='upper'));assert(upper.includes('<details class="scene-context">'));assert(upper.includes('data-save="upper"')&&upper.includes('data-share="upper"')&&upper.includes('data-tour-from="upper"'));
const hw=ctx.cardHTML(steps.find(s=>s.id==='hw'));assert(hw.includes('holyweek.html')&&hw.includes('First day of the week'));
const prayer = steps.find(s=>s.id==='pray');const prayerHtml=ctx.cardHTML(prayer);
assert(prayer.verse.includes('Yet not what I will, but what You will.'));
assert(prayerHtml.includes('precise prayer site unknown')&&prayerHtml.includes('The full verse'));
assert(ctx.cardHTML(steps.find(s=>s.id==='risen')).includes('traditional and later-proposed'));
assert.deepEqual(Array.from(ex.primary('risen')),['sepulchre','gardentomb']);
for (const id of ['temple','upper','pray','golgotha','burial','risen']) for (const pl of ex.primary(id)) assert(steps.find(s=>s.id===id).show.includes(pl), id+' focuses a place it shows: '+pl);
assert.deepEqual(Array.from(ex.primary('trials')),[], 'debated praetorium sites get no focus ring');
assert.deepEqual(Array.from(ex.visible(steps[0])),['star','jerusalem']);
for (const id of ex.visible(steps[0])) assert(steps[0].show.includes(id) || id==='jerusalem', id+' is an existing place');
assert(ctx.window.WAY.PLACES.jerusalem, 'opening labels are existing places');
assert.deepEqual(Array.from(ex.visible({show:['a','b']})),['a','b']);
const index=fs.readFileSync('index.html','utf8');assert(index.indexOf('js/experience.js')<index.indexOf('js/app.js'));assert(index.includes('css/style.css?v=54')&&index.includes('js/app.js?v=54'));assert(fs.readFileSync('sw.js','utf8').includes('the-way-v32'));
console.log('PASS: all 90 scenes and model/content files retained; opening contains Bethlehem; stable Holy Week orientation; valid camera padding across six screen sizes, long captions, and extra header bars; real scene markup retains readings, notes, quotations and tools; cache versions updated. Logic checks, not browser visual QA.');
