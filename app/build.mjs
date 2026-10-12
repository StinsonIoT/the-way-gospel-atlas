// Builds the app's web folder (www) from the website at the repository root.
// The website stays the single source: this copies it, adds the app-only
// script (native.js) and the bundled Bible, and leaves out what the app does
// not need (share pages, tools, the service worker).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const www = path.join(here, 'www');

const COPY = ['index.html', 'about.html', 'sources.html', 'holyweek.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'og.png',
  'css', 'js', 'fonts', 'vendor', 'data'];

fs.rmSync(www, { recursive: true, force: true });
fs.mkdirSync(www, { recursive: true });
for (const item of COPY) {
  const from = path.join(root, item);
  if (!fs.existsSync(from)) { console.warn('missing', item); continue; }
  fs.cpSync(from, path.join(www, item), { recursive: true });
}
fs.copyFileSync(path.join(here, 'native.js'), path.join(www, 'js', 'native.js'));
fs.cpSync(path.join(here, 'bible'), path.join(www, 'bible'), { recursive: true });

// Load native.js before any other script on every page.
for (const page of fs.readdirSync(www).filter((f) => f.endsWith('.html'))) {
  const p = path.join(www, page);
  let html = fs.readFileSync(p, 'utf8');
  const at = html.indexOf('<script');
  const tag = '<script src="js/native.js"></script>\n';
  html = at >= 0 ? html.slice(0, at) + tag + html.slice(at) : html.replace('</body>', tag + '</body>');
  fs.writeFileSync(p, html);
}
console.log('www ready:', fs.readdirSync(www).join(', '));
