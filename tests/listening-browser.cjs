const assert = require('node:assert/strict');

module.exports = async ({ evaluate, send, navigate, waitFor, sleep, base, errors }) => {
  await send('Network.setBlockedURLs', { urls: ['*s3.amazonaws.com*'] });
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await navigate(base + '/'); await waitFor(`document.body.classList.contains('ready')`);
  let reopenCount = 0;
  const reopen = async (hash = '') => { await navigate(base + '/?listening-test=' + (++reopenCount) + hash); await waitFor(`document.body.classList.contains('ready')`); };
  await evaluate(`localStorage.clear(); localStorage.setItem('the-way:tour', JSON.stringify({ how:'listen', len:'full', reader:'hays', rate:1.25, pace:1, where:'here', sleep:'0' })); localStorage.setItem('the-way:follow','mk');`);
  await reopen('#s-trials');
  async function fixture() {
    await evaluate(`(async () => {
      const original = window.fetch.bind(window), book = await (await original('data/bsb/MRK.json?v=1')).json();
      const bytes = new Uint8Array(44 + 8000 * 180), d = new DataView(bytes.buffer);
      const text = (offset,value) => { for(let i=0;i<value.length;i++) bytes[offset+i]=value.charCodeAt(i); };
      text(0,'RIFF'); d.setUint32(4,bytes.length-8,true); text(8,'WAVEfmt '); d.setUint32(16,16,true); d.setUint16(20,1,true); d.setUint16(22,1,true); d.setUint32(24,8000,true); d.setUint32(28,8000,true); d.setUint16(32,1,true); d.setUint16(34,8,true); text(36,'data'); d.setUint32(40,bytes.length-44,true); bytes.fill(128,44);
      const urls = {14:URL.createObjectURL(new Blob([bytes],{type:'audio/wav'})),15:URL.createObjectURL(new Blob([bytes],{type:'audio/wav'}))};
      window.fetch = (url, options) => {
        const chapter = /\\/BSB\\/MRK\\/(14|15)\\.json$/.exec(String(url));
        if(chapter) { const n=+chapter[1]; return Promise.resolve(new Response(JSON.stringify({translation:{id:'BSB'}, chapter:{number:n,content:book.chapters[String(n)]}, thisChapterAudioLinks:{hays:urls[n]}, thisChapterAudioTimings:{hays:'/listen-fixture-'+n+'.json'}}))); }
        const timing = /listen-fixture-(14|15)\\.json$/.exec(String(url));
        if(timing) return Promise.resolve(new Response(JSON.stringify({verses:book.chapters[timing[1]].filter(v=>v.type==='verse').map((v,i)=>i+1)})));
        return original(url,options);
      };
    })()`);
  }
  const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
  await fixture();
  await click('[data-tour-from="trials"]');
  await waitFor(`document.querySelector('#t-audio').dataset.kind === 'tour' && document.querySelector('#t-audio').readyState >= 1`);
  await evaluate(`document.querySelector('#t-audio').dispatchEvent(new Event('ended'))`);
  await waitFor(`document.querySelector('#t-audio').readyState >= 1 && document.querySelector('#t-audio').currentTime >= 1 && document.querySelector('#t-audio').currentTime < 16`);
  await evaluate(`document.querySelector('#t-audio').currentTime=8.375`);
  await click('#t-play');
  const bookmark = await evaluate(`JSON.parse(localStorage.getItem('the-way:listening') || 'null')`);
  assert(bookmark, 'pausing saves a listening bookmark');
  assert.equal(bookmark.scene, 'trials');
  assert.equal(bookmark.segment.id, 'mark:15:1:15');
  assert(Math.abs(bookmark.segment.offset - 7.375) < .25, 'bookmark records position within the second chapter');
  assert.equal(bookmark.settings.reader, 'hays'); assert.equal(bookmark.settings.rate, 1.25);
  await click('#t-x');
  await reopen();
  assert(await evaluate(`document.querySelector('#tour').hidden && document.querySelector('#t-audio').paused`), 'reopening does not autoplay');
  assert(await evaluate(`!!document.querySelector('.resume-listen')`), 'opening offers Resume listening');
  for (const [label, width, height] of [['mobile',390,844],['desktop',1440,900]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor:1, mobile:label==='mobile' });
    await sleep(300);
    assert(await evaluate(`(() => { const r=document.querySelector('.resume-listen').getBoundingClientRect(); return r.width>=44 && r.height>=44 && r.left>=0 && r.right<=innerWidth && document.documentElement.scrollWidth<=innerWidth; })()`), 'resume control fits '+label);
    const shot=await send('Page.captureScreenshot',{format:'png'});
    require('node:fs').writeFileSync(require('node:path').join(require('node:os').tmpdir(),'way-resume-'+label+'.png'),Buffer.from(shot.data,'base64'));
  }
  await send('Emulation.setDeviceMetricsOverride', { width:390,height:844,deviceScaleFactor:1,mobile:true });
  await fixture();
  await click('.resume-listen');
  await waitFor(`document.querySelector('#t-audio').readyState >= 1 && document.querySelector('#t-audio').currentTime >= 8 && document.querySelector('#t-audio').dataset.kind === 'tour'`);
  const restored = await evaluate(`({time:document.querySelector('#t-audio').currentTime,rate:document.querySelector('#t-audio').playbackRate,narrator:document.querySelector('#t-sub').textContent,gospel:document.querySelector('#f-name').textContent,hash:location.hash})`);
  assert(Math.abs(restored.time - 8.375) < .75, 'resume seeks to the saved position, not the start of either chapter');
  assert.equal(restored.rate, 1.25); assert(restored.narrator.includes('Hays')); assert.equal(restored.gospel, 'Mark'); assert.equal(restored.hash, '#s-trials');
  await click('#t-play'); await click('#t-x');
  await reopen();
  await click('.resume-x');
  assert(await evaluate(`!localStorage.getItem('the-way:listening') && localStorage.getItem('the-way:last') === 'trials'`), 'dismissing listening keeps reading progress');
  await evaluate(`localStorage.setItem('the-way:listening', ${JSON.stringify(JSON.stringify({ ...bookmark, end: 'trials' }))})`);
  await reopen();
  await fixture();
  await evaluate(`window.resumeFixtureFetch = window.fetch; window.fetch = (url, options) => String(url).includes('/api/BSB/MRK/') ? Promise.reject(Error('offline')) : window.resumeFixtureFetch(url, options);`);
  await click('.resume-listen');
  await waitFor(`document.querySelector('#t-sub').textContent.includes('audio unavailable')`);
  assert(await evaluate(`!document.querySelector('#tour').classList.contains('playing')`), 'unavailable resumed audio stays paused');
  const unavailable = await evaluate(`JSON.parse(localStorage.getItem('the-way:listening'))`);
  assert.equal(unavailable.segment.id, bookmark.segment.id, 'offline resume preserves the original chapter bookmark');
  assert.equal(unavailable.segment.offset, bookmark.segment.offset);
  await evaluate(`window.fetch = window.resumeFixtureFetch`);
  await click('#t-play');
  await waitFor(`document.querySelector('#t-audio').readyState >= 1 && document.querySelector('#t-audio').currentTime >= 8`);
  await evaluate(`(() => { const a=document.querySelector('#t-audio'); a.currentTime=16; a.dispatchEvent(new Event('timeupdate')); })()`);
  await waitFor(`localStorage.getItem('the-way:listening') === null && document.querySelector('#t-title').textContent === 'The end of the story'`);
  assert.equal(errors.length, 0, 'no uncaught browser errors');
  console.log('PASS: listening survives reload, resumes the second chapter at its saved position/narrator/speed/Gospel, requires a tap, preserves unavailable audio for retry, and clears on completion or dismissal.');
};
