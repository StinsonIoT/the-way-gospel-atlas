// Browser journey audit, invoked with node tests/browser-smoke.cjs --journey-review.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

module.exports = async ({ evaluate, send, navigate, waitFor, sleep, base, errors }) => {
  const findings = [];
  await send('Network.setBlockedURLs', { urls: ['*s3.amazonaws.com*'] });
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
  async function reset(hash = '') {
    await navigate(base + '/');
    await waitFor(`document.body.classList.contains('ready')`);
    await evaluate('localStorage.clear()');
    await navigate(base + '/' + hash);
    await waitFor(`document.body.classList.contains('ready') && document.querySelectorAll('.step').length === 90`);
  }
  async function jump(scene) {
    await evaluate(`(() => { const i = [...document.querySelectorAll('.step')].findIndex(s => s.dataset.scene === ${JSON.stringify(scene)}); document.querySelector('#toc-body [data-i="'+i+'"]').click(); })()`);
    await waitFor(`location.hash === '#s-${scene}'`);
    await sleep(200);
  }
  async function menu(tab) {
    await click('#chapter-btn');
    if (tab !== 'chapters') await click('#tab-' + tab);
    await waitFor(`document.querySelector('#toc').open && !document.querySelector('#panel-${tab}').hidden`);
  }
  async function check(name, run) {
    const only = process.argv.find(arg => arg.startsWith('--only='));
    if (only && !only.slice(7).split(',').some(fragment => name.includes(fragment))) return;
    try { await reset(); await run(); findings.push({ name, status: 'pass' }); console.log('PASS: ' + name); }
    catch (error) { findings.push({ name, status: 'fail', detail: error.message }); console.log('FAIL: ' + name + ': ' + error.message); }
  }

  await check('Story tour settings, pause, resume, skip, and stop', async () => {
    await jump('voice');
    await click('[data-tour-setup]');
    await waitFor(`document.querySelector('#tourset').open`);
    await evaluate(`(() => { const f = document.querySelector('#ts-form'); f.elements.how.value = 'silent'; f.elements.where.value = 'here'; f.dispatchEvent(new Event('change', { bubbles: true })); f.requestSubmit(); })()`);
    await waitFor(`!document.querySelector('#tour').hidden && document.querySelector('#tour').classList.contains('playing')`);
    assert.equal(await evaluate(`JSON.parse(localStorage.getItem('the-way:tour')).how`), 'silent');
    await click('#t-play');
    await waitFor(`!document.querySelector('#tour').classList.contains('playing')`);
    await click('#t-play');
    await waitFor(`document.querySelector('#tour').classList.contains('playing')`);
    const initial = await evaluate('location.hash');
    await click('#t-next');
    await waitFor(`location.hash !== ${JSON.stringify(initial)}`);
    await click('#t-set');
    await waitFor(`document.querySelector('#tourset').open`);
    assert.equal(await evaluate(`document.querySelector('#ts-form').elements.how.value`), 'silent');
    await click('#ts-close');
    await click('#t-x');
    assert(await evaluate(`document.querySelector('#tour').hidden`));
  });

  await check('Begin, chapter jump, and return', async () => {
    await click('[data-story-jump="land"]');
    await waitFor(`location.hash === '#s-land'`);
    await jump('pray');
    assert(await evaluate(`!document.querySelector('#back-pill').hidden`));
    await click('#back-pill');
    await waitFor(`location.hash === '#s-land'`);
  });
  await check('Deep link and resume after reopening', async () => {
    await navigate(base + '/#s-pray');
    await waitFor(`document.body.classList.contains('ready') && localStorage.getItem('the-way:last') === 'pray'`);
    await navigate(base + '/');
    await waitFor(`!document.querySelector('#resume').hidden`);
    await click('.resume-go');
    await waitFor(`location.hash === '#s-pray'`);
  });
  await check('Search words, references, abbreviations, and no matches', async () => {
    await click('#search-open');
    for (const [query, expected] of [['Peter', 'person:peter'], ['John 4', null], ['Mk 14:36', null], ['no_such_atlas_word_987', 'empty']]) {
      await evaluate(`(() => { const q = document.querySelector('#q'); q.value = ${JSON.stringify(query)}; q.dispatchEvent(new Event('input', { bubbles: true })); })()`);
      await sleep(350);
      if (expected === 'empty') assert.equal(await evaluate(`document.querySelectorAll('#results [data-i]').length`), 0);
      else if (expected) assert(await evaluate(`!!document.querySelector('#results [data-explain="${expected}"]')`));
      else assert(await evaluate(`document.querySelectorAll('#results [data-i]').length > 0`), query + ' returns scenes');
    }
  });
  await check('People, words, and topics open their content', async () => {
    await menu('people');
    await click('#people-body [aria-controls="pp-peter"]');
    assert(await evaluate(`document.querySelector('#pp-peter').textContent.length > 50 && document.querySelector('[aria-controls="pp-peter"]').getAttribute('aria-expanded') === 'true'`));
    await click('#tab-search');
    await click('#results [data-explain]');
    await waitFor(`document.querySelector('#explain').open`);
    await click('#ex-close');
    await click('#tab-topics');
    await click('#topic-chips [data-topic]');
    assert(await evaluate(`document.querySelectorAll('#topic-results [data-i]').length > 0`));
  });
  await check('Follow a Gospel, move forward/back, persist, and stop', async () => {
    await jump('voice');
    await menu('chapters');
    await click('[data-gf="mk"]');
    await click('[data-follow-f="mk"]');
    await waitFor(`!document.querySelector('#follow').hidden && document.querySelector('#f-name').textContent === 'Mark'`);
    const initial = await evaluate('location.hash');
    await click('#f-next');
    await waitFor(`location.hash !== ${JSON.stringify(initial)}`);
    await click('#f-prev');
    await waitFor(`location.hash === ${JSON.stringify(initial)}`);
    await navigate(base + '/');
    await waitFor(`document.body.classList.contains('ready') && !document.querySelector('#follow').hidden`);
    await click('#f-x');
    assert(await evaluate(`document.querySelector('#follow').hidden && !localStorage.getItem('the-way:follow')`));
  });
  await check('Save, reopen, find in Plan, and remove', async () => {
    await jump('voice');
    await click('.step[data-scene="voice"] .scene-tools summary');
    await click('[data-save="voice"]');
    assert.equal(await evaluate(`document.querySelector('[data-save="voice"]').getAttribute('aria-pressed')`), 'true');
    await navigate(base + '/#s-voice');
    await waitFor(`document.body.classList.contains('ready')`);
    assert.equal(await evaluate(`document.querySelector('[data-save="voice"]').getAttribute('aria-pressed')`), 'true');
    await menu('plan');
    assert(await evaluate(`!!document.querySelector('#plan-body [data-unsave="voice"]')`));
    await click('#plan-body [data-unsave="voice"]');
    assert.equal(await evaluate(`JSON.parse(localStorage.getItem('the-way:saved')).length`), 0);
  });
  await check('Reading progress persists and reset preserves saved scenes', async () => {
    await jump('voice');
    await waitFor(`JSON.parse(localStorage.getItem('the-way:seen') || '[]').includes('voice')`, 5000);
    await click('.step[data-scene="voice"] .scene-tools summary');
    await click('[data-save="voice"]');
    await menu('plan');
    assert.equal(await evaluate(`document.querySelectorAll('.plan-days > li').length`), 30);
    await click('.plan-reset');
    assert(await evaluate(`JSON.parse(localStorage.getItem('the-way:seen')).includes('voice')`), 'first tap asks for confirmation');
    await click('.plan-reset');
    assert.equal(await evaluate(`JSON.parse(localStorage.getItem('the-way:seen')).length`), 0);
    assert(await evaluate(`JSON.parse(localStorage.getItem('the-way:saved')).includes('voice')`));
  });
  await check('Place profile, map exploration, quick jump, and return', async () => {
    await jump('pray');
    await menu('places');
    await click('.toc-head[aria-controls="pl-nazareth"]');
    assert(await evaluate(`document.querySelector('#pl-nazareth .pl-info').textContent.includes('How sure')`));
    await click('[data-explore="place:nazareth"]');
    await waitFor(`document.documentElement.classList.contains('exploring') && !document.querySelector('#toc').open`);
    await click('.explore-jumps [data-view="jerusalem"]');
    await sleep(300);
    await click('#explore-close');
    await waitFor(`!document.documentElement.classList.contains('exploring') && location.hash === '#s-pray'`);
  });
  await check('Go deeper tabs retain the scene', async () => {
    await jump('voice');
    await click('[data-deep="voice"]');
    await waitFor(`document.querySelector('#deeper').open`);
    const tabs = await evaluate(`[...document.querySelectorAll('#dp-tabs button')].map(b => b.dataset.layer)`);
    assert(tabs.length > 1);
    for (const tab of tabs) {
      await click('#dp-tabs [data-layer="' + tab + '"]');
      assert(await evaluate(`document.querySelector('#dp-body').textContent.length > 20`));
    }
    await click('#dp-close');
    assert.equal(await evaluate('location.hash'), '#s-voice');
  });
  await check('Scripture saved-copy fallback and study-note error state', async () => {
    await jump('pray');
    await evaluate(`(() => { const original = window.fetch.bind(window); window.fetch = (url, options) => String(url).includes('bible.helloao.org') ? Promise.reject(Error('audit offline')) : original(url, options); })()`);
    await click('.step[data-scene="pray"] .ref');
    await waitFor(`document.querySelector('#passage').open && document.querySelector('#passage-body .p-text sup')`);
    assert(await evaluate(`document.querySelector('#passage-body').textContent.includes('Abba')`));
    await click('#pt-notes');
    await waitFor(`document.querySelector('#passage-notes').textContent.includes('couldn’t be loaded')`);
    await click('#passage-close');
    assert.equal(await evaluate('location.hash'), '#s-pray');
  });
  await check('Sharing copies a scene link and share page returns to the scene', async () => {
    await jump('voice');
    await click('.step[data-scene="voice"] .scene-tools summary');
    await evaluate(`Object.defineProperty(navigator, 'share', { value: undefined, configurable: true }); Object.defineProperty(navigator, 'clipboard', { value: { writeText: async text => { window.auditCopiedLink = text; } }, configurable: true });`);
    await click('[data-share="voice"]');
    await waitFor(`window.auditCopiedLink`);
    assert.equal(await evaluate('window.auditCopiedLink'), base + '/s/voice.html');
    await send('Page.navigate', { url: base + '/s/voice.html' });
    await waitFor(`document.body?.classList.contains('ready') && location.hash === '#s-voice'`);
  });
  await check('Offline download cancel, timeout, Plan reopening, and retry', async () => {
    await evaluate(`(async () => {
      const original = window.fetch.bind(window), books = {};
      for (const code of ['MAT', 'MRK', 'LUK', 'JHN', 'ACT']) books[code] = await (await original('data/bsb/' + code + '.json?v=1')).json();
      window.auditDownloadMode = 'stall';
      window.fetch = (url, options) => {
        const match = /\\/api\\/(BSB|c\\/tyndale)\\/([A-Z0-9]+)\\/(\\d+)\\.json$/.exec(String(url));
        if (!match) return original(url, options);
        if (window.auditDownloadMode === 'stall') return new Promise((resolve, reject) => options?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true }));
        const content = match[1] === 'BSB' ? books[match[2]].chapters[match[3]] : [{ type: 'verse', number: 1, content: ['Offline audit note.'] }];
        return Promise.resolve(new Response(JSON.stringify({ translation: { id: 'BSB' }, chapter: { number: +match[3], content } })));
      };
    })()`);
    await menu('plan');
    await click('.plan-offline');
    await waitFor(`document.querySelector('.plan-offline').disabled && document.querySelector('.plan-cancel')`);
    await click('#tab-chapters'); await click('#tab-plan');
    assert(await evaluate(`document.querySelector('.plan-offline').disabled && document.querySelector('.plan-offline').textContent.includes('Saving')`), 'download status survives Plan reopening');
    await click('.plan-cancel');
    await waitFor(`!document.querySelector('.plan-offline').disabled && document.querySelector('.plan-offline').textContent.includes('Canceled')`);
    await click('.plan-offline');
    await waitFor(`!document.querySelector('.plan-offline').disabled && document.querySelector('.plan-offline').textContent.includes('Try again')`, 12000);
    assert(await evaluate(`!document.querySelector('.plan-cancel')`), 'stopped download removes Cancel');
    await evaluate(`window.auditDownloadMode = 'success'`);
    await click('.plan-offline');
    await waitFor(`!document.querySelector('.plan-offline').disabled && document.querySelector('.plan-offline').textContent.includes('Saved for offline')`, 30000);
    assert(await evaluate(`caches.open('the-way-bible').then(c => c.match('https://bible.helloao.org/api/BSB/ACT/2.json')).then(Boolean)`), 'retry caches the final chapter');
    await navigate(base + '/');
    await waitFor(`document.body.classList.contains('ready')`);
    await menu('plan');
    assert(await evaluate(`document.querySelector('.plan-offline').dataset.done === '1'`), 'completed download survives reload');
  });
  await check('Stalled study notes leave loading', async () => {
    await jump('pray');
    await evaluate(`(() => { const original = window.fetch.bind(window); window.fetch = (url, options) => {
      if (String(url).includes('/api/c/tyndale/')) return new Promise((resolve, reject) => options?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true }));
      if (String(url).includes('bible.helloao.org')) return Promise.reject(Error('use saved text'));
      return original(url, options);
    }; })()`);
    await click('.step[data-scene="pray"] .ref');
    await waitFor(`document.querySelector('#passage-body .p-text sup')`);
    await click('#pt-notes');
    await sleep(12000);
    const status = await evaluate(`document.querySelector('#passage-notes').textContent`);
    assert(!status.includes('Loading study notes'), 'study notes still display Loading study notes after a 12-second stalled request');
    await evaluate(`(() => { const original = window.fetch; window.fetch = (url, options) => String(url).includes('/api/c/tyndale/') ? Promise.resolve(new Response(JSON.stringify({ chapter: { content: [{ type: 'verse', number: 36, content: ['14:36 Recovered study note.'] }] } }))) : original(url, options); })()`);
    await click('.notes-retry');
    await waitFor(`document.querySelector('#passage-notes .snote')?.textContent.includes('Recovered study note')`);
  });
  await check('Stalled audio timing leaves loading', async () => {
    await jump('voice');
    await click('.step[data-scene="voice"] .scene-tools summary');
    await evaluate(`(async () => {
      const original = window.fetch.bind(window);
      const book = await (await original('data/bsb/MRK.json?v=1')).json();
      const chapter = { translation: { id: 'BSB' }, chapter: { number: 1, content: book.chapters['1'] }, thisChapterAudioLinks: { souer: 'https://example.invalid/audit.mp3' }, thisChapterAudioTimings: { souer: '/audit-stalled.audioTimings.json' } };
      window.fetch = (url, options) => String(url).endsWith('/BSB/MRK/1.json') ? Promise.resolve(new Response(JSON.stringify(chapter)))
        : String(url).endsWith('/audit-stalled.audioTimings.json') ? new Promise((resolve, reject) => options?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true })) : original(url, options);
    })()`);
    await click('.step[data-scene="voice"] .ref');
    await waitFor(`document.querySelector('#passage-body .p-text sup')`);
    await waitFor(`!document.querySelector('#p-audio-bar').hidden && document.querySelector('#p-reader').textContent.includes('whole chapter audio')`, 12000);
    assert(await evaluate(`document.documentElement.scrollWidth <= innerWidth + 1`), 'whole-chapter notice fits on a phone');
    await click('#passage-close');
    await click('[data-tour-from="voice"]');
    await waitFor(`!document.querySelector('#tour').hidden`);
    await sleep(12000);
    assert(!(await evaluate(`document.querySelector('#t-sub').textContent`)).startsWith('Loading'), 'story tour still displays Loading after a 12-second stalled verse-timing request');
  });
  findings.push({ name: 'Uncaught browser exceptions', status: errors.length ? 'fail' : 'pass', detail: errors });
  const selected = process.argv.find(arg => arg.startsWith('--only='));
  const output = path.join(os.tmpdir(), 'way-functionality-review' + (selected ? '-' + selected.slice(7).replace(/[^a-z0-9]/gi, '_') : '') + '.json');
  fs.writeFileSync(output, JSON.stringify(findings, null, 2));
  console.log('Audit results: ' + output);
  if (findings.some(f => f.status === 'fail')) process.exitCode = 1;
};
