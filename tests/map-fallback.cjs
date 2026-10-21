const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

module.exports = async ({ send, evaluate, navigate, waitFor, base, errors }) => {
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `
    const originalContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      return /webgl/i.test(type) ? null : originalContext.call(this, type, ...args);
    };
    const originalFetch = window.fetch.bind(window);
    window.fetch = (url, options) => String(url).includes('bible.helloao.org')
      ? Promise.reject(new Error('offline Bible fixture')) : originalFetch(url, options);
  ` });
  for (const [width, height, query] of [[390, 844, ''], [1280, 800, '?look=atlas']]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 700 });
    await navigate(base + '/' + query + '#s-pray');
    await waitFor(`document.body.classList.contains('ready')`, 3000);
    assert.equal(await evaluate(`window.__wayMap`), null, 'no WebGL map was constructed');
    assert.equal(await evaluate(`document.querySelectorAll('.step').length`), 90);
    assert(await evaluate(`!document.querySelector('#map-status').hidden && document.querySelector('#map-status').textContent.includes('read')`));
    await waitFor(`document.body.dataset.moment === 'pray'`);
    await waitFor(`document.querySelector('#s-pray').firstElementChild.getBoundingClientRect().top >= document.querySelector('.top').getBoundingClientRect().bottom`);
    assert(await evaluate(`document.documentElement.scrollWidth <= innerWidth + 1`));
    assert(await evaluate(`getComputedStyle(document.querySelector('[data-explore]')).display === 'none'`));
    await evaluate(`document.querySelector('#s-pray [data-ref]').click()`);
    await waitFor(`document.querySelector('#passage').open && document.querySelector('#passage-body .p-text sup')`);
    await evaluate(`document.querySelector('#passage-close').click(); document.querySelector('#search-open').click(); const q = document.querySelector('#q'); q.value = 'John 4'; q.dispatchEvent(new Event('input', { bubbles: true }));`);
    await waitFor(`document.querySelector('#toc').open && document.querySelector('#results [data-i]')`);
    await evaluate(`document.querySelector('#results [data-i]').click()`);
    await waitFor(`!document.querySelector('#toc').open && location.hash !== '#s-pray'`);
    await waitFor(`document.querySelector(location.hash).firstElementChild.getBoundingClientRect().top >= document.querySelector('.top').getBoundingClientRect().bottom`);
    await evaluate(`document.querySelector('[data-tour-setup]').click()`);
    await waitFor(`document.querySelector('#tourset').open`);
    await evaluate(`document.querySelector('#ts-close').click()`);
    await evaluate(`(async () => {
      const original = window.fetch.bind(window);
      window.fallbackAudioEvents = [];
      for (const event of ['play', 'playing', 'pause', 'ended', 'loadedmetadata']) document.querySelector('#t-audio').addEventListener(event, () => {
        const a = document.querySelector('#t-audio'); window.fallbackAudioEvents.push({event, kind: a.dataset.kind, paused: a.paused, time: a.currentTime, title: document.querySelector('#t-title').textContent});
      });
      const book = await (await original('data/bsb/JHN.json?v=1')).json();
      const mark = await (await original('data/bsb/MRK.json?v=1')).json();
      const bytes = new Uint8Array(44 + 8000 * 60), d = new DataView(bytes.buffer);
      const text = (offset, value) => { for (let i = 0; i < value.length; i++) bytes[offset + i] = value.charCodeAt(i); };
      text(0, 'RIFF'); d.setUint32(4, bytes.length - 8, true); text(8, 'WAVEfmt ');
      d.setUint32(16, 16, true); d.setUint16(20, 1, true); d.setUint16(22, 1, true);
      d.setUint32(24, 8000, true); d.setUint32(28, 8000, true); d.setUint16(32, 1, true); d.setUint16(34, 8, true);
      text(36, 'data'); d.setUint32(40, bytes.length - 44, true); bytes.fill(128, 44);
      const audio = URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' }));
      const markAudio = URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' }));
      window.fetch = (url, options) => String(url).endsWith('/BSB/JHN/5.json')
        ? Promise.resolve(new Response(JSON.stringify({ translation: { id: 'BSB' }, book: { commonName: 'John' }, chapter: { number: 5, content: book.chapters['5'] }, thisChapterAudioLinks: { souer: audio }, thisChapterAudioTimings: { souer: '/fallback.timings.json' } })))
        : String(url).endsWith('/BSB/MRK/2.json')
          ? Promise.resolve(new Response(JSON.stringify({ translation: { id: 'BSB' }, book: { commonName: 'Mark' }, chapter: { number: 2, content: mark.chapters['2'] }, thisChapterAudioLinks: { souer: markAudio }, thisChapterAudioTimings: { souer: '/fallback.mark.timings.json' } })))
        : String(url).endsWith('/fallback.timings.json')
          ? Promise.resolve(new Response(JSON.stringify({ verses: book.chapters['5'].filter(v => v.type === 'verse').map((_, i) => i + 1) })))
          : String(url).endsWith('/fallback.mark.timings.json')
            ? Promise.resolve(new Response(JSON.stringify({ verses: mark.chapters['2'].filter(v => v.type === 'verse').map((_, i) => i + 1) }))) : original(url, options);
      document.querySelector('[data-tour-from="bethesda"]').click();
    })()`);
    await waitFor(`document.querySelector('#t-audio').dataset.kind === 'tour' && !document.querySelector('#t-audio').paused && document.querySelector('#t-audio').currentTime > 0`);
    await evaluate(`document.querySelector('#t-play').click()`);
    assert(await evaluate(`document.querySelector('#t-audio').paused`), 'actual audio pauses without a map');
    await evaluate(`document.querySelector('#t-play').click()`);
    await waitFor(`!document.querySelector('#t-audio').paused`);
    await evaluate(`document.querySelector('#t-next').click()`);
    try {
      await waitFor(`location.hash === '#s-roof' && document.body.dataset.moment === 'roof' && !document.querySelector('#t-audio').paused`);
    } catch (err) {
      console.log(await evaluate(`({hash: location.hash, moment: document.body.dataset.moment, kind: document.querySelector('#t-audio').dataset.kind, paused: document.querySelector('#t-audio').paused, status: document.querySelector('#t-sub').textContent, events: window.fallbackAudioEvents})`));
      throw err;
    }
    await evaluate(`document.querySelector('#t-x').click()`);
    assert.equal(errors.length, 0, 'reading, Scripture and search work without uncaught errors');
    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(os.tmpdir(), `way-no-webgl-${width}.png`), Buffer.from(screenshot.data, 'base64'));
    await evaluate(`document.querySelector('.brand').click()`);
    await waitFor(`document.body.dataset.moment === 'title' && scrollY < 10`);
    assert(await evaluate(`getComputedStyle(document.querySelector('.top')).backgroundColor !== 'rgba(0, 0, 0, 0)'`), 'opening navigation has a readable background');
    const opening = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(os.tmpdir(), `way-no-webgl-opening-${width}.png`), Buffer.from(opening.data, 'base64'));
  }
  console.log('PASS: WebGL failure retains 90 scenes, scene links, Scripture, search, audio playback/pause/resume/next-scene, and readable phone/desktop layouts.');
};
