// Generate cache keys from file contents; run after editing release assets.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const pending = new Map();
// Git may check text out with CRLF on Windows and LF in CI. Cache keys must agree.
const read = file => {
  const data = pending.has(file) ? Buffer.from(pending.get(file)) : fs.readFileSync(path.join(root, file));
  return /\.(?:html|css|js|json|svg|txt|webmanifest)$/.test(file) ? Buffer.from(data.toString().replace(/\r\n/g, '\n')) : data;
};
const hash = data => crypto.createHash('sha256').update(data).digest('hex').slice(0, 12);
const replacements = new Map(), versions = {};
const pages = new Map(['index.html', 'about.html', 'sources.html', 'holyweek.html'].map(file => [file, read(file).toString()]));
let worker = read('sw.js').toString();
const urls = [...new Set([...pages.values()].flatMap(html => [...html.matchAll(/(?:src|href)="((?:js|css|vendor)\/[^\"]+)"/g)].map(m => m[1])))];
for (const url of urls.filter(u => u.startsWith('css/'))) {
  const file = url.split('?')[0];
  const css = read(file).toString().replace(/(\.\.\/[^?'"\s)]+)\?v=[^'"\s)]+/g, (old, relative) => {
    const dependency = path.relative(root, path.resolve(root, path.dirname(file), relative)).split(path.sep).join('/');
    if (dependency.startsWith('../')) throw Error('Asset outside project: ' + dependency);
    const digest = hash(read(dependency)); versions[dependency] = digest;
    replacements.set(old.slice(3), dependency + '?v=' + digest);
    return relative + '?v=' + digest;
  });
  pending.set(file, css);
}
for (const url of urls) {
  const file = url.split('?')[0], digest = hash(read(file));
  versions[file] = digest; replacements.set(url, file + '?v=' + digest);
}
for (const [old, url] of replacements) {
  for (const [file, html] of pages) pages.set(file, html.split('"' + old + '"').join('"' + url + '"'));
  worker = worker.split("'" + old + "'").join("'" + url + "'");
}
for (const [file, html] of pages) pending.set(file, html);
const shellMatch = /const SHELL = (\[[\s\S]*?\]);/.exec(worker);
if (!shellMatch) throw Error('Service worker shell not found');
const shell = vm.runInNewContext(shellMatch[1]);
const digest = crypto.createHash('sha256');
digest.update(worker.replace(/const APP = '[^']+';/, "const APP = '__CONTENT_HASH__';"));
for (const url of shell) { const file = url === './' ? 'index.html' : url.split('?')[0]; digest.update(url); digest.update(read(file)); }
const cacheName = 'the-way-app-' + digest.digest('hex').slice(0, 12);
worker = worker.replace(/const APP = '[^']+';/, "const APP = '" + cacheName + "';");
pending.set('sw.js', worker);
pending.set('assets.json', JSON.stringify({ version: 1, cacheName, assets: Object.fromEntries(Object.entries(versions).sort(([a], [b]) => a.localeCompare(b))) }, null, 2) + '\n');
const changed = [...pending].filter(([file, text]) => !fs.existsSync(path.join(root, file)) || fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n') !== text);
if (process.argv.includes('--check')) {
  if (changed.length) { console.error('Run npm run assets; stale files: ' + changed.map(([file]) => file).join(', ')); process.exitCode = 1; }
  else console.log('PASS: asset URLs and offline cache match file contents.');
} else {
  for (const [file, text] of changed) fs.writeFileSync(path.join(root, file), text);
  console.log('Updated ' + changed.length + ' asset files; cache ' + cacheName);
}
