const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
module.exports = async ({ evaluate, send, navigate, waitFor, base, errors }) => {
  for (const [name, width, height] of [['mobile', 390, 844], ['desktop', 1440, 900]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: name === 'mobile' });
    console.log(name, 'opening guide');
    await navigate(base + '/holyweek.html');
    console.log(name, 'opening passage');
    await evaluate(`(() => {
      window.readerNotesFail = true; window.readerNotesCalls = 0;
      const realFetch = window.fetch;
      window.fetch = (url, opts) => {
        if (String(url).includes('/api/c/tyndale/')) {
          window.readerNotesCalls++;
          return window.readerNotesFail ? Promise.reject(Error('test outage')) : Promise.resolve(new Response(JSON.stringify({chapter:{content:[]}}), {status:200}));
        }
        if (String(url).startsWith('https://bible.helloao.org/')) return Promise.reject(Error('test outage'));
        return realFetch(url, opts);
      };
      document.querySelector('a[data-ref]').click();
    })()`);
    console.log(name, 'waiting for saved passage');
    await waitFor(`document.querySelector('#reader').open && document.querySelector('[data-p="text"]').innerText.includes('saved copy')`);
    assert(await evaluate(`document.querySelector('[data-p="text"]').innerText.length > 100`), 'bundled Scripture renders during API outage');
    await evaluate(`document.querySelector('#rd-tab-text').focus()`);
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight' });
    await waitFor(`!!document.querySelector('.rd-retry')`);
    assert(await evaluate(`document.activeElement.id === 'rd-tab-notes' && document.querySelector('#rd-tab-notes').tabIndex === 0 && document.querySelector('#rd-tab-text').tabIndex === -1`), 'arrow key activates and focuses notes with roving tabindex');
    await evaluate(`window.readerNotesFail = false; document.querySelector('.rd-retry').click()`);
    await waitFor(`document.querySelector('[data-p="notes"]').innerText.includes('No study notes')`);
    assert(await evaluate(`window.readerNotesCalls >= 2`), 'retry makes a new request');
    await evaluate(`document.querySelector('#rd-tab-notes').focus()`);
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Home', code: 'Home' });
    assert(await evaluate(`document.activeElement.id === 'rd-tab-text' && !document.querySelector('[data-p="text"]').hidden`), 'Home returns to Scripture');
    assert(await evaluate(`document.documentElement.scrollWidth <= innerWidth && document.querySelector('#reader').getBoundingClientRect().width <= innerWidth`), 'no horizontal overflow');
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(os.tmpdir(), 'way-reader-' + name + '.png'), Buffer.from(shot.data, 'base64'));
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await waitFor(`!document.querySelector('#reader').open`);
    assert(await evaluate(`document.activeElement.matches('a[data-ref]')`), 'closing restores reference focus');
    console.log('PASS:', name, 'guide fallback, notes retry, keyboard tabs, Escape/focus restoration, viewport.');
  }
  assert.equal(errors.length, 0, 'no uncaught browser exceptions');
};
