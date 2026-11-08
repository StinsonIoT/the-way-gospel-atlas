const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const manifest = JSON.parse(fs.readFileSync('assets.json', 'utf8'));
assert.equal(manifest.version, 1);
for (const [file, expected] of Object.entries(manifest.assets)) {
  const data = fs.readFileSync(file);
  const canonical = /\.(?:html|css|js|json|svg|txt|webmanifest)$/.test(file) ? Buffer.from(data.toString().replace(/\r\n/g, '\n')) : data;
  const actual = crypto.createHash('sha256').update(canonical).digest('hex').slice(0, 12);
  assert.equal(actual, expected, file + ' content matches its cache key');
}
cp.execFileSync(process.execPath, ['tools/version-assets.cjs', '--check'], { stdio: 'inherit' });
