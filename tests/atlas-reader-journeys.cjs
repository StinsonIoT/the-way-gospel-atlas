const assert = require('node:assert/strict');
module.exports = async ({ evaluate, send, navigate, waitFor, sleep, base, errors }) => {
  await send('Network.setBlockedURLs', { urls: ['*s3.amazonaws.com*'] });
  for (const [name, width, height] of [['mobile', 390, 844], ['desktop', 1440, 900]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: name === 'mobile' });
    await navigate(base + '/');
    await waitFor(`document.querySelectorAll('.step').length === 90`);
    await evaluate(`(() => {
      const realFetch = window.fetch;
      window.staleChapterCalls = 0;
      window.fetch = (url, opts) => {
        if (String(url).includes('/api/BSB/JHN/')) {
          window.staleChapterCalls++;
          return new Promise(resolve => window.finishStaleChapter = () => resolve(new Response(JSON.stringify({translation:{id:'BSB'},chapter:{content:[{type:'verse',number:1,content:['Test verse']}]} }), {status:200})));
        }
        if (String(url).includes('/api/c/tyndale/')) return Promise.reject(Error('test notes outage'));
        if (String(url).startsWith('https://bible.helloao.org/')) return Promise.reject(Error('test API outage'));
        return realFetch(url, opts);
      };
      const a = document.createElement('a'); a.id='review-reference'; a.href='#'; a.dataset.ref='John 14–16'; a.textContent='Review passage'; document.body.append(a); a.focus(); a.click();
    })()`);
    await waitFor(`document.querySelector('#passage').open && typeof finishStaleChapter === 'function'`);
    await evaluate(`document.querySelector('#passage-close').click()`);
    await waitFor(`!document.querySelector('#passage').open`);
    await evaluate(`finishStaleChapter()`); await sleep(100);
    assert.equal(await evaluate(`staleChapterCalls`), 1, 'closing stops later chapters');
    assert(await evaluate(`document.querySelector('#p-audio-bar').hidden`), 'closed reader cannot acquire audio controls');
    await evaluate(`(() => {
      const a=document.querySelector('#review-reference'); a.dataset.ref='Mark 1:1'; a.focus(); a.click();
    })()`);
    await waitFor(`document.querySelector('#passage-body').innerText.includes('saved copy')`);
    await evaluate(`document.querySelector('#pt-text').focus()`);
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight' });
    await waitFor(`!!document.querySelector('.notes-retry')`);
    assert(await evaluate(`document.activeElement.id === 'pt-notes' && document.querySelector('#pt-text').tabIndex === -1`), 'notes keyboard selection');
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Home', code: 'Home' });
    assert(await evaluate(`document.activeElement.id === 'pt-text' && !document.querySelector('#passage-body').hidden`), 'keyboard returns to Scripture');
    assert(await evaluate(`document.documentElement.scrollWidth <= innerWidth && document.querySelector('#passage').getBoundingClientRect().width <= innerWidth`), 'reader fits viewport');
    await evaluate(`document.querySelector('#passage-close').click()`);
    await waitFor(`!document.querySelector('#passage').open && document.activeElement.id === 'review-reference'`);
    console.log('PASS:', name, 'main reader close-during-load, fallback, keyboard tabs, viewport and focus restoration.');
  }
  assert.equal(errors.length, 0, 'no uncaught browser exceptions');
};
