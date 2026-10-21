// Capture screenshots of key scenes, for comparing how the map looks before and after a change.
//
//   node tools/capture-scenes.cjs --out shots [--look off|atlas|both] [--sizes 390x844,1280x800]
//                                 [--scenes title,land,fishers] [--settle 9000] [--base http://localhost:8000]
//
// With no --base it serves this folder itself. It needs Chrome: set CHROME_PATH (for example to
// /opt/pw-browsers/chromium-*/chrome-linux/chrome). On Linux as root, point CHROME_PATH at a wrapper
// script that adds --no-sandbox. It uses no packages, like the tests.
//
// The map draws with software graphics in headless Chrome, and the camera and the 3D models take a
// moment to settle, so a frame is a good comparison only if it is taken after the same --settle time
// on both sides. Frames of the same code taken this way match exactly, so any difference you see
// between two runs is a real change. It is not a substitute for looking at a real phone.
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

const arg = (name, fallback) => { const i = process.argv.indexOf('--' + name); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback; };
const out = path.resolve(arg('out', 'shots'));
const looks = arg('look', 'off') === 'both' ? ['off', 'atlas'] : [arg('look', 'off')];
const sizes = arg('sizes', '390x844,1280x800').split(',').map(s => s.split('x').map(Number));
// The opening, the regional map, Egypt (night), Galilee, Nazareth, Jerusalem (3D), Holy Week, Gethsemane (night), the cross, the tomb, Emmaus, the ascension.
const scenes = arg('scenes', 'title,land,egypt,fishers,synagogue,temple,entry,pray,golgotha,risen,emmaus,ascension').split(',');
const settle = +arg('settle', 9000);
const root = path.resolve(__dirname, '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg' };
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  let base = arg('base', '');
  let server;
  if (!base) {
    server = http.createServer((req, res) => {
      const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname === '/' ? '/index.html' : new URL(req.url, 'http://localhost').pathname));
      if (!file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
      fs.readFile(file, (err, data) => { res.writeHead(err ? 404 : 200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(err ? 'Not found' : data); });
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    base = `http://localhost:${server.address().port}`;
  }
  fs.mkdirSync(out, { recursive: true });
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'way-capture-'));
  const chrome = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const browser = spawn(chrome, ['--headless=new', '--no-first-run', '--no-default-browser-check', '--enable-unsafe-swiftshader', '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
  browser.on('error', err => { console.error(err); process.exit(1); });
  const portFile = path.join(profile, 'DevToolsActivePort');
  for (let i = 0; i < 150 && !fs.existsSync(portFile); i++) await sleep(100);
  if (!fs.existsSync(portFile)) { console.error('Chrome did not start. Set CHROME_PATH.'); process.exit(1); }
  const port = fs.readFileSync(portFile, 'utf8').split('\n')[0];
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
  let id = 0; const pending = new Map();
  ws.addEventListener('message', ev => { const msg = JSON.parse(ev.data); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result); pending.delete(msg.id); } });
  const send = (method, params = {}) => new Promise(resolve => { const i = ++id; pending.set(i, resolve); ws.send(JSON.stringify({ id: i, method, params })); });
  const evaluate = async expression => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result.value;

  for (const look of looks) {
    for (const [width, height] of sizes) {
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 700 });
      await send('Page.navigate', { url: base + '/index.html' + (look === 'atlas' ? '?look=atlas' : '') });
      await sleep(7000);
      for (const scene of scenes) {
        const found = await evaluate(scene === 'title'
          ? 'window.scrollTo(0, 0), true'
          : `(() => { const el = document.querySelector('#s-${scene}'); if (el) el.scrollIntoView({ block: 'start' }); return !!el; })()`);
        if (!found) { console.log(`skip ${scene}: no such scene`); continue; }
        await sleep(settle);
        const file = path.join(out, `${width}x${height}-${scene}-${look}.png`);
        fs.writeFileSync(file, Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
        console.log(file);
      }
    }
  }
  browser.kill();
  if (server) server.close();
  process.exit(0);
})();
