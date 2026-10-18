const assert = require('node:assert/strict');
module.exports = async ({ evaluate, send, navigate, waitFor, base, errors }) => {
  await send('Network.setBlockedURLs', { urls: ['*s3.amazonaws.com*'] });
  await navigate(base + '/');
  await waitFor(`document.body.classList.contains('ready')`);
  await evaluate(`(() => {
    const original = window.fetch.bind(window);
    window.cancelAudit = { mode: 'chapter', requests: [], aborted: [] };
    window.fetch = (url, options) => {
      const u = String(url), state = window.cancelAudit;
      const chapter = /api\\/BSB\\/([A-Z0-9]+)\\/(\\d+)\\.json/.exec(u);
      const notes = u.includes('/c/tyndale/'), timing = u.includes('/cancel-timing/');
      if (!chapter && !notes && !timing) return original(url, options);
      state.requests.push(u);
      if (notes || timing || state.mode === 'chapter') return new Promise((resolve, reject) => {
        options.signal.addEventListener('abort', () => { state.aborted.push(u); reject(options.signal.reason); }, { once: true });
      });
      return original('data/bsb/' + chapter[1] + '.json?v=1').then(r => r.json()).then(book => new Response(JSON.stringify({
        translation: { id: 'BSB' }, chapter: { number: +chapter[2], content: book.chapters[chapter[2]] },
        thisChapterAudioLinks: { hays: '/recording.mp3' }, thisChapterAudioTimings: { hays: '/cancel-timing/' + chapter[1] + '/' + chapter[2] }
      })));
    };
    const link = document.createElement('a'); link.id = 'cancel-ref'; link.dataset.ref = 'Mark 14:53–15:15'; link.href = '#'; document.body.append(link);
  })()`);
  const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
  await click('#cancel-ref');
  await waitFor(`cancelAudit.requests.length === 1`);
  await click('#passage-close');
  await waitFor(`cancelAudit.aborted.length === 1`);
  assert.equal(await evaluate('cancelAudit.requests.length'), 1, 'closing prevents later chapter requests');
  await evaluate(`cancelAudit.mode = 'timing'`);
  await click('#cancel-ref');
  await waitFor(`document.querySelector('#passage-body .v') && cancelAudit.requests.some(u => u.includes('/cancel-timing/'))`);
  await click('#pt-notes');
  await waitFor(`cancelAudit.requests.some(u => u.includes('/c/tyndale/'))`);
  await click('#pt-text');
  await waitFor(`cancelAudit.aborted.some(u => u.includes('/c/tyndale/'))`);
  await click('#passage-close');
  await waitFor(`cancelAudit.aborted.some(u => u.includes('/cancel-timing/'))`);
  await click('[data-tour-from="trials"]');
  await waitFor(`cancelAudit.requests.filter(u => u.includes('/cancel-timing/')).length >= 2`);
  await click('#t-next');
  await waitFor(`cancelAudit.aborted.filter(u => u.includes('/cancel-timing/')).length >= 2`);
  await waitFor(`cancelAudit.requests.filter(u => u.includes('/cancel-timing/')).length >= 3`);
  await click('#t-x');
  await waitFor(`cancelAudit.aborted.filter(u => u.includes('/cancel-timing/')).length >= 3`);
  assert.equal(errors.length, 0, 'no uncaught errors from interrupted readers or tours');
  console.log('PASS: browser reader close/reopen, notes-tab change, timing cancellation, tour skip and stop abort pending requests.');
};
