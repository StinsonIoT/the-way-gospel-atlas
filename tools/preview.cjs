// Local network preview: node tools/preview.cjs
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const root = path.resolve(__dirname, '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.txt': 'text/plain' };
const folders = new Set(['css', 'js', 'data', 'vendor', 'fonts', 's']);
http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400); res.end(); return; }
  const segments = pathname.split('/').filter(Boolean);
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (segments.some(part => part.startsWith('.')) || (segments.length > 1 && !folders.has(segments[0])) || !file.startsWith(root + path.sep) || !types[path.extname(file)]) {
    res.writeHead(404); res.end('Not found'); return;
  }
  fs.readFile(file, (err, data) => {
    res.writeHead(err ? 404 : 200, { 'Content-Type': types[path.extname(file)], 'Cache-Control': 'no-cache' });
    res.end(err ? 'Not found' : data);
  });
}).listen(8001, '0.0.0.0', () => {
  console.log('Computer preview: http://localhost:8001/');
  for (const [name, addresses] of Object.entries(os.networkInterfaces())) {
    for (const address of addresses) if (address.family === 'IPv4' && !address.internal && !address.address.startsWith('169.254.')) console.log(name + ': http://' + address.address + ':8001/');
  }
});
