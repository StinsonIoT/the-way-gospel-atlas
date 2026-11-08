const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const files = fs.readdirSync(path.join(root, 'tests')).filter(file => file.endsWith('.cjs') && !file.includes('browser') && file !== 'journeys.cjs').sort();
for (const file of files) {
  const result = spawnSync(process.execPath, [path.join(root, 'tests', file)], { cwd: root, stdio: 'inherit', windowsHide: true });
  if (result.error) { console.error(result.error); process.exit(1); }
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log('PASS: ' + files.length + ' unit and content suites.');
