const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const root = path.resolve(__dirname, '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg' };
let serveOldWorker = true;
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const file = path.resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, (err, data) => {
    if (!err && url.pathname === '/sw.js' && serveOldWorker) {
      data = Buffer.from(data.toString().replace(/const APP = '[^']+';/, "const APP = 'the-way-v0';")
        .replace(/const SHELL = \[[\s\S]*?\];/, "const SHELL = ['./', 'index.html'];"));
    }
    res.writeHead(err ? 404 : 200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(err ? 'Not found' : data);
  });
});
let browser, ws;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'way-browser-test-'));
const errors = [], handlers = new Map(), pending = new Map();
let sequence = 0;
function send(method, params = {}) {
  const id = ++sequence;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(Error('CDP timeout: ' + method)); }, 30000);
    pending.set(id, { resolve: value => { clearTimeout(timer); resolve(value); }, reject: err => { clearTimeout(timer); reject(err); } });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
}
async function waitFor(expression, timeout = 20000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) { if (await evaluate(expression)) return; await sleep(100); }
  const diagnostic = await evaluate(`({ url: location.href, title: document.title, steps: document.querySelectorAll('.step').length, reader: document.querySelector('#reader')?.innerText, text: document.body.innerText.slice(0, 150) })`);
  throw Error('Timed out: ' + expression + '\n' + JSON.stringify({ diagnostic, errors }));
}
async function navigate(url) {
  await send('Page.navigate', { url });
  await waitFor(`location.href === ${JSON.stringify(url)} && document.readyState === 'complete'`);
}
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://localhost:${server.address().port}`;
  const chrome = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  browser = spawn(chrome, ['--headless=new', '--no-first-run', '--no-default-browser-check', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required', '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
  browser.on('error', err => { console.error(err); process.exitCode = 1; });
  const portFile = path.join(profile, 'DevToolsActivePort');
  for (let i = 0; i < 150 && !fs.existsSync(portFile); i++) await sleep(100);
  assert(fs.existsSync(portFile), 'Chrome remote debugging started');
  const port = fs.readFileSync(portFile, 'utf8').split('\n')[0];
  console.log('Chrome started; connecting to browser automation.');
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(10000) })).json();
  ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); });
  ws.addEventListener('message', ev => {
    const msg = JSON.parse(ev.data);
    if (msg.id) { const item = pending.get(msg.id); pending.delete(msg.id); if (!item) return; if (msg.error) item.reject(Error(JSON.stringify(msg.error))); else item.resolve(msg.result); }
    else if (handlers.has(msg.method)) handlers.get(msg.method)(msg.params);
  });
  handlers.set('Runtime.exceptionThrown', p => errors.push(p.exceptionDetails));
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  if (process.argv.includes('--inspect-opening')) {
    const chapter = await (await fetch('https://bible.helloao.org/api/BSB/JHN/1.json', { signal: AbortSignal.timeout(15000) })).json();
    const reader = 'souer';
    const timing = await (await fetch(new URL(chapter.thisChapterAudioTimings[reader], 'https://bible.helloao.org/'), { signal: AbortSignal.timeout(15000) })).json();
    const recording = await (await fetch(chapter.thisChapterAudioLinks[reader], { signal: AbortSignal.timeout(20000) })).arrayBuffer();
    const encoded = Buffer.from(recording).toString('base64');
    const endTimes = [timing.verses[1], timing.verses[5]];
    const appSource = fs.readFileSync('js/app.js', 'utf8');
    const audioHelpers = appSource.slice(appSource.indexOf('function audioBounds('), appSource.indexOf('async function prepareAudio('));
    const result = await evaluate(`(async () => {
      ${audioHelpers}
      const context = new AudioContext();
      const raw = Uint8Array.from(atob(${JSON.stringify(encoded)}), c => c.charCodeAt(0));
      const recordingUrl = URL.createObjectURL(new Blob([raw], { type: 'audio/mpeg' }));
      const decoded = await context.decodeAudioData(raw.buffer);
      const samples = decoded.getChannelData(0), rate = decoded.sampleRate;
      const rms = (t, width) => { let sum = 0, count = 0; for(let i = Math.floor(t*rate); i < Math.min(samples.length, Math.floor((t+width)*rate)); i++) { sum += samples[i]*samples[i]; count++; } return Math.sqrt(sum/Math.max(1,count)); };
      const results = ${JSON.stringify(endTimes)}.map(end => {
        const windows = [];
        for(let offset = -0.5; offset <= 1.5; offset += 0.05) windows.push({ t: +(end+offset).toFixed(3), rms: +rms(end+offset,0.05).toFixed(5) });
        return { end, atBoundary: +rms(end,0.05).toFixed(5), windows };
      });
      const actualStops = [];
      let rangeIndex = 0;
      for (const providerBoundary of ${JSON.stringify(endTimes)}) {
        const { end } = audioBounds(${JSON.stringify(chapter)}, ${JSON.stringify(timing)}, 1, rangeIndex++ === 0 ? 1 : 5);
        const media = new Audio(recordingUrl);
        await new Promise((resolve, reject) => { media.onloadedmetadata = resolve; media.onerror = reject; media.load(); });
        await new Promise(resolve => { media.onseeked = resolve; media.currentTime = end - 1.3; });
        let active = true;
        const stop = new Promise(resolve => watchAudioEnd(media, () => active ? { end } : null, () => {
          active = false; media.pause(); actualStops.push({ providerBoundary, reviewedBoundary: end, pausedAt: media.currentTime, overshoot: media.currentTime - end }); resolve();
        }));
        await media.play(); await stop; media.removeAttribute('src'); media.load();
      }
      URL.revokeObjectURL(recordingUrl); await context.close(); return { waveform: results, actualStops };
    })()`);
    for (const stop of result.actualStops) assert(stop.pausedAt < stop.providerBoundary - 0.02, 'opening stops in silence before the next verse begins');
    console.log(JSON.stringify({ reader, durationBytes: recording.byteLength, actualStops: result.actualStops }, null, 2));
    return;
  }
  // Terrain is external and not necessary to test the local shell or captions.
  await send('Network.setBlockedURLs', { urls: ['*s3.amazonaws.com*'] });
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  console.log('Loading the local atlas.');
  await navigate(base + '/');
  await waitFor(`document.querySelectorAll('.step').length === 90`);
  await waitFor(`navigator.serviceWorker.controller !== null`);
  assert(await evaluate(`caches.has('the-way-v0')`), 'old worker fixture is installed');
  serveOldWorker = false;
  await evaluate(`navigator.serviceWorker.getRegistration().then(r => r.update())`);
  await waitFor(`caches.has('the-way-v43').then(async found => found && !(await caches.has('the-way-v0')))`);
  console.log('PASS: browser activates the new worker and removes the old application cache.');
  for (const [width, height] of [[320, 568], [390, 844], [844, 390]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: true });
    await sleep(200);
    const size = await evaluate(`({ width: innerWidth, content: document.documentElement.scrollWidth })`);
    assert(size.content <= size.width + 1, `no sideways overflow at ${width}x${height}: ` + JSON.stringify(size));
  }
  console.log('PASS: main page loads without horizontal overflow at three phone sizes.');
  await waitFor(`document.body.classList.contains('ready')`);
  if (process.argv.includes('--profile-scroll')) {
    const profile = await evaluate(`(async () => {
      const stats = { cameraUpdates: 0, layoutReads: 0, overlayUpdates: 0, frames: 0, slowFrames: 0, maxFrameMs: 0 };
      const jump = maplibregl.Map.prototype.jumpTo;
      const rect = Element.prototype.getBoundingClientRect;
      let source, setData;
      maplibregl.Map.prototype.jumpTo = function(...args) {
        stats.cameraUpdates++;
        if (!source) {
          source = this.getSource('overlay'); setData = source.setData;
          source.setData = function(...values) { stats.overlayUpdates++; return setData.apply(this, values); };
        }
        return jump.apply(this, args);
      };
      Element.prototype.getBoundingClientRect = function(...args) { stats.layoutReads++; return rect.apply(this, args); };
      const target = document.querySelectorAll('.step')[5].offsetTop;
      const start = performance.now(); let last = start;
      await new Promise(resolve => {
        const tick = now => {
          const delta = now - last; last = now;
          stats.frames++; stats.maxFrameMs = Math.max(stats.maxFrameMs, delta);
          if (delta > 34) stats.slowFrames++;
          scrollTo(0, target * Math.min(1, (now - start) / 3000));
          if (now - start < 3000) requestAnimationFrame(tick); else resolve();
        };
        requestAnimationFrame(tick);
      });
      await new Promise(resolve => setTimeout(resolve, 200));
      maplibregl.Map.prototype.jumpTo = jump; Element.prototype.getBoundingClientRect = rect;
      if (source) source.setData = setData;
      return stats;
    })()`);
    console.log(JSON.stringify(profile, null, 2));
    return;
  }
  await evaluate(`document.querySelector('#chapter-btn').click(); document.querySelector('#toc-body [data-i="60"]').click()`);
  await waitFor(`!document.querySelector('#back-pill').hidden && location.hash !== ''`);
  const back = await evaluate(`(() => { const b = document.querySelector('#back-pill'); const r = b.getBoundingClientRect(); return { text: b.innerText, top: r.top, bottom: r.bottom, visibility: getComputedStyle(b).visibility, header: document.querySelector('header').getBoundingClientRect().bottom }; })()`);
  assert.equal(back.visibility, 'visible'); assert(back.top >= back.header && back.bottom <= 390, 'Back is visible below the header');
  await evaluate(`document.querySelector('#back-pill').click()`);
  await waitFor(`scrollY < 10 && document.querySelector('#back-pill').hidden`);
  console.log('PASS: a menu jump displays "' + back.text + '", and Back returns to the beginning.');
  // Test the actual tour player with a local chapter and silent WAV recording.
  // This checks media seeking and stopping, rather than the quality of narration.
  await evaluate(`(async () => {
    const original = window.fetch.bind(window);
    const book = await (await original('data/bsb/JHN.json?v=1')).json();
    const bytes = new Uint8Array(44 + 8000 * 60), d = new DataView(bytes.buffer);
    const text = (offset, value) => { for (let i = 0; i < value.length; i++) bytes[offset + i] = value.charCodeAt(i); };
    text(0, 'RIFF'); d.setUint32(4, bytes.length - 8, true); text(8, 'WAVEfmt ');
    d.setUint32(16, 16, true); d.setUint16(20, 1, true); d.setUint16(22, 1, true);
    d.setUint32(24, 8000, true); d.setUint32(28, 8000, true); d.setUint16(32, 1, true); d.setUint16(34, 8, true);
    text(36, 'data'); d.setUint32(40, bytes.length - 44, true); bytes.fill(128, 44);
    window.tourTestAudio = URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' }));
    const content = book.chapters['5'];
    const chapter = { translation: { id: 'BSB' }, book: { commonName: 'John' }, chapter: { number: 5, content },
      thisChapterAudioLinks: { souer: window.tourTestAudio }, thisChapterAudioTimings: { souer: '/fixture.audioTimings.json' } };
    window.originalTourFetch = original;
    window.fetch = (url, options) => String(url).endsWith('/BSB/JHN/5.json') ? Promise.resolve(new Response(JSON.stringify(chapter)))
      : String(url).endsWith('/fixture.audioTimings.json') ? Promise.resolve(new Response(JSON.stringify({ verses: content.filter(v => v.type === 'verse').map((_, i) => i + 1) })))
      : original(url, options);
    document.querySelector('[data-tour-from="bethesda"]').click();
  })()`);
  await waitFor(`document.querySelector('#t-audio').dataset.kind === 'tour' && document.querySelector('#t-audio').readyState >= 1 && document.querySelector('#t-audio').currentTime >= 4`);
  assert(await evaluate(`document.querySelector('#t-audio').currentTime < 5`), 'John 5:5 starts at its actual compact-array timestamp');
  await evaluate(`(() => { document.querySelector('#t-play').click(); const a = document.querySelector('#t-audio'); a.currentTime = 8.96; a.dispatchEvent(new Event('timeupdate')); })()`);
  assert.equal(await evaluate(`document.querySelector('#t-audio').dataset.kind`), 'tour', 'last fraction of final verse remains in the segment');
  await evaluate(`(() => { const a = document.querySelector('#t-audio'); a.currentTime = 9; a.dispatchEvent(new Event('timeupdate')); })()`);
  assert.equal(await evaluate(`document.querySelector('#t-audio').dataset.kind`), 'done', 'tour completes at the actual next-verse boundary');
  await evaluate(`document.querySelector('#t-x').click(); window.fetch = window.originalTourFetch; URL.revokeObjectURL(window.tourTestAudio)`);
  console.log('PASS: Play the story seeks correctly across a verse-number gap and preserves the final fraction of the selected verse.');
  await evaluate(`(() => {
    document.querySelector('#chapter-btn').click(); document.querySelector('#tab-plan').click();
    window.testOpenCache = caches.open;
    caches.open = async () => { throw Error('simulated storage failure'); };
    document.querySelector('.plan-offline').click();
  })()`);
  await waitFor(`document.querySelector('.plan-offline').textContent.includes('storage is unavailable') && !document.querySelector('.plan-offline').disabled`);
  await evaluate(`(() => {
    caches.open = async () => ({ match: async () => ({}), put: async () => {} });
    document.querySelector('.plan-offline').click();
  })()`);
  await waitFor(`document.querySelector('.plan-offline').textContent.includes('Saved for offline') && !document.querySelector('.plan-offline').disabled`);
  await evaluate(`caches.open = window.testOpenCache; document.querySelector('#toc').close()`);
  console.log('PASS: browser displays the storage error, enables retry, and completes a retry.');
  await send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
  await navigate(base + '/');
  await waitFor(`document.querySelectorAll('.step').length === 90`);
  assert.equal(errors.length, 0, 'no uncaught JavaScript exceptions after offline reload');
  console.log('PASS: installed app reopens offline with all 90 scenes and no uncaught JavaScript exceptions.');
  await send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  // Page-level fetch interception also covers requests handled by the worker.
  // Keep Bible requests pending until the reader's actual AbortSignal fires.
  await navigate(base + '/holyweek.html');
  await waitFor(`document.querySelector('#reader') !== null`);
  await evaluate(`(() => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = (url, options) => String(url).includes('bible.helloao.org/api/')
      ? new Promise((resolve, reject) => options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true }))
      : originalFetch(url, options);
  })()`);
  const ref = await evaluate(`(() => { const a = document.querySelector('a[data-ref]'); a.click(); return a.dataset.ref; })()`);
  console.log('Testing stalled Scripture request: ' + ref);
  await waitFor(`document.querySelector('.rd-status')?.textContent.includes('saved copy')`, 16000);
  assert(await evaluate(`document.querySelector('.rd-text sup') !== null`), 'fallback displays actual verses');
  console.log('PASS: stalled Holy Week passage (' + ref + ') falls back to saved BSB text.');
  await evaluate(`document.querySelector('.rd-x').click()`);
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await evaluate(`document.querySelector('a.scene[href*="s-burial"]').scrollIntoView()`);
  await sleep(200);
  const guideY = await evaluate('scrollY');
  assert(guideY > 1000, 'test starts well into the guide');
  await evaluate(`document.querySelector('a.scene[href*="s-burial"]').click()`);
  await waitFor(`location.search.includes('guide=holyweek') && document.body.classList.contains('ready') && document.querySelector('#back-name')?.textContent === 'Holy Week guide'`);
  await evaluate(`window.scrollBy(0, 2000)`);
  await sleep(200);
  assert(await evaluate(`!document.querySelector('#back-pill').hidden`), 'guide return survives scrolling');
  // Internal map jumps still have their own Back action before returning to the guide.
  await evaluate(`document.querySelector('#chapter-btn').click(); document.querySelector('#toc-body [data-i="10"]').click()`);
  await waitFor(`!document.querySelector('#back-pill').hidden && document.querySelector('#back-name').textContent !== 'Holy Week guide'`);
  await evaluate(`document.querySelector('#back-pill').click()`);
  await waitFor(`document.querySelector('#back-name')?.textContent === 'Holy Week guide'`);
  await evaluate(`document.querySelector('#back-pill').click()`);
  await waitFor(`location.pathname === '/holyweek.html' && Math.abs(scrollY - ${guideY}) < 5`);
  console.log('PASS: a Holy Week place link provides a persistent return button, internal map Back still works, and the guide restores the exact reading position.');
  assert.equal(errors.length, 0, 'no uncaught browser errors');
})().catch(err => { console.error(err); process.exitCode = 1; }).finally(async () => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ id: ++sequence, method: 'Browser.close' }));
    await sleep(500);
  }
  if (ws) ws.close();
  if (browser) browser.kill();
  server.close();
  // Keep the isolated browser profile in the OS temp directory for diagnosis.
});
