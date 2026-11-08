const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
test.beforeEach(async ({ page }) => {
  await page.route('**/elevation-tiles-prod/**', route => route.abort());
});
async function ready(page, hash = '#s-word') {
  await page.goto('/' + hash); await expect(page.locator('body')).toHaveClass(/ready/);
}
async function plan(page) { await page.locator('#chapter-btn').click(); await page.locator('#tab-plan').click(); }

test('reading view preserves the scene, navigates, and survives reopening', async ({ page }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.stack || e.message));
  await ready(page, '#s-birth');
  await page.locator('#reading-toggle').click();
  await expect(page.locator('html')).toHaveClass(/reading-mode/);
  await expect(page.locator('#reading-pane h2')).toContainText('manger');
  await page.locator('#scene-next').click();
  await expect(page).toHaveURL(/#s-shepherds$/);
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/reading-mode/);
  await expect(page.locator('#reading-pane')).toContainText('Savior has been born');
  await page.locator('#scene-prev').click();
  await expect(page.locator('#reading-pane h2')).toContainText('manger');
  await page.locator('#reading-toggle').click();
  await expect(page.locator('html')).not.toHaveClass(/reading-mode/);
  await expect(page).toHaveURL(/#s-birth$/);
  expect(errors).toEqual([]);
});

test('a plan day has a real stopping point and explicit completion', async ({ page }) => {
  await ready(page); await plan(page);
  await page.locator('#plan-day-29 > summary').click();
  await page.locator('[data-plan-read="29"]').click();
  const ids = await page.evaluate(() => window.WAY_PLAN[29][1]);
  await expect(page).toHaveURL(new RegExp('#s-' + ids[0] + '$'));
  await page.locator('#reading-toggle').click();
  await expect(page.locator('#scene-prev')).toBeDisabled();
  for (const id of ids.slice(1)) { await page.locator('#scene-next').click(); await expect(page).toHaveURL(new RegExp('#s-' + id + '$')); }
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('the-way:completed-days') || '[]'))).toEqual([]);
  await expect(page.locator('#scene-next')).toHaveText('Finish day');
  await page.locator('#scene-next').click();
  await expect(page.locator('#day-finish')).toBeVisible();
  await page.locator('[data-day-complete]').click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('the-way:completed-days')))).toContain(29);
  await page.locator('[data-day-pause]').click();
  await expect(page.locator('#day-finish')).not.toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('the-way:active-day'))).toBe('29');
  await page.locator('#scene-next').click();
  await expect(page.locator('[data-day-complete]')).toBeDisabled();
  await expect(page.locator('[data-day-complete]')).toHaveText('Day finished');
  await page.locator('[data-day-leave]').click();
  await expect(page.locator('#day-finish')).not.toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('the-way:active-day'))).toBeNull();
});

test('saved reflections can be revisited and exported without deleting them', async ({ page }) => {
  await ready(page); await page.locator('#s-word [data-deep]').click(); await page.locator('[data-layer="ask"]').click();
  const note = 'A thought to revisit: <script>plain text</script>';
  await page.locator('#reflection-note').fill(note); await page.locator('[data-reflection-save]').click();
  await expect(page.locator('#reflection-status')).toContainText('saved on this device');
  await page.locator('#dp-close').click(); await plan(page);
  const pending = page.waitForEvent('download'); await page.locator('[data-journal-export="json"]').click();
  const download = await pending, data = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
  expect(data.format).toBe('the-way-journal'); expect(data.reflections.find(n => n.scene === 'word').text).toBe(note);
  await page.locator('[data-reflection-open="word"]').click();
  await expect(page.locator('#reflection-note')).toHaveValue(note);
  await page.locator('#dp-close').click(); await plan(page);
  await page.locator('[data-journal-clear]').click();
  expect(await page.evaluate(() => localStorage.getItem('the-way:reflection:word'))).toBe(note);
  await page.locator('[data-journal-clear]').click();
  expect(await page.evaluate(() => localStorage.getItem('the-way:reflection:word'))).toBeNull();
});

async function audioFixture(page) {
  const duration = 180, rate = 8000, bytes = duration * rate * 2, wav = Buffer.alloc(44 + bytes);
  wav.write('RIFF', 0); wav.writeUInt32LE(36 + bytes, 4); wav.write('WAVEfmt ', 8); wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22); wav.writeUInt32LE(rate, 24); wav.writeUInt32LE(rate * 2, 28);
  wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(bytes, 40);
  await page.route('**/fixture-audio.wav', route => route.fulfill({ contentType: 'audio/wav', body: wav }));
  await page.route('**/fixture-timing-*.json', route => {
    const match = /fixture-timing-([A-Z0-9]+)-(\d+)/.exec(route.request().url());
    const book = JSON.parse(fs.readFileSync(path.join(root, 'data/bsb', match[1] + '.json')));
    const count = book.chapters[match[2]].filter(v => v.type === 'verse').length;
    return route.fulfill({ json: { verses: Array.from({ length: count }, (_, i) => i + 1) } });
  });
  await page.route('https://bible.helloao.org/api/BSB/**', route => {
    const match = /\/BSB\/([A-Z0-9]+)\/(\d+)\.json/.exec(route.request().url());
    if (!match) return route.fulfill({ status: 404, body: '{}' });
    const book = JSON.parse(fs.readFileSync(path.join(root, 'data/bsb', match[1] + '.json')));
    return route.fulfill({ json: { translation: { id: 'BSB' }, chapter: { number: +match[2], content: book.chapters[match[2]] },
      thisChapterAudioLinks: { hays: 'http://127.0.0.1:4173/fixture-audio.wav' }, thisChapterAudioTimings: { hays: '/fixture-timing-' + match[1] + '-' + match[2] + '.json' } } });
  });
  await page.addInitScript(() => { if (!localStorage.getItem('the-way:tour')) localStorage.setItem('the-way:tour', JSON.stringify({ how: 'listen', len: 'full', reader: 'hays', rate: 1, pace: 1, sleep: '0' })); });
}

test('day listening keeps its lower and upper bounds after resume and settings changes', async ({ page }) => {
  test.setTimeout(120000);
  if (test.info().project.name === 'phone') await page.setViewportSize({ width: 320, height: 568 });
  await audioFixture(page); await ready(page); await plan(page);
  await page.locator('#plan-day-1 > summary').click(); await page.locator('[data-plan-listen="1"]').click();
  const ids = await page.evaluate(() => window.WAY_PLAN[1][1]);
  await expect.poll(() => page.locator('#t-audio').getAttribute('data-kind')).toBe('tour');
  await page.locator('#t-play').click();
  expect(await page.locator('#t-sub').evaluate(el => ({ clipped: el.scrollWidth > el.clientWidth, bottom: el.getBoundingClientRect().bottom, viewport: innerHeight }))).toMatchObject({ clipped: false });
  await page.screenshot({ path: test.info().outputPath('listening-paused.png') });
  let bookmark = await page.evaluate(() => JSON.parse(localStorage.getItem('the-way:listening')));
  expect(bookmark.scope).toEqual(ids); expect(bookmark.scene).toBe(ids[0]); expect(bookmark.end).toBe(ids.at(-1));
  await page.reload(); await expect(page.locator('body')).toHaveClass(/ready/);
  await plan(page); await page.locator('[data-journey-listen]').click();
  await expect.poll(() => page.locator('#t-audio').getAttribute('data-kind')).toBe('tour');
  await page.locator('#t-set').click(); await expect(page.locator('#ts-where')).toHaveValue('selection');
  await page.locator('#ts-form select[name="rate"]').selectOption('1.25');
  await page.locator('#ts-start').click();
  await expect.poll(() => page.locator('#t-audio').getAttribute('data-kind')).toBe('tour');
  await page.locator('#t-play').click();
  bookmark = await page.evaluate(() => JSON.parse(localStorage.getItem('the-way:listening')));
  expect(bookmark.scope).toEqual(ids); expect(bookmark.settings.rate).toBe(1.25);
  await expect(page.locator('#t-prev')).toBeDisabled();
  for (const id of ids.slice(1)) { await page.locator('#t-next').click(); await expect.poll(() => page.locator('#t-title').textContent()).toBe(await page.evaluate(id => { const s = window.WAY.STEPS.find(s => s.id === id); return (s.kind === 'verse' ? s.kicker : s.title || s.kicker).replace(/<[^>]+>/g, ''); }, id)); }
  await page.locator('#t-next').click(); await expect(page.locator('#day-finish')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('the-way:listening'))).toBeNull();
});

test('reading and reflection remain usable with larger text and a short phone viewport', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await ready(page, '#s-birth');
  await page.locator('#reading-toggle').click();
  await page.addStyleTag({ content: '#reading-pane .text, #reading-pane .after, #reading-pane .card .text { font-size: 30px; } .scene-nav button { font-size: 16px; }' });
  await expect.poll(() => page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--reader-header-height')) >= document.querySelector('.top').getBoundingClientRect().bottom - 1)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.setViewportSize({ width: 844, height: 390 });
  await expect.poll(() => page.evaluate(() => Math.abs(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--reader-header-height')) - document.querySelector('.top').getBoundingClientRect().bottom) < 2)).toBe(true);
  await page.locator('#reading-pane [data-deep]').click();
  await page.locator('[data-layer="ask"]').click();
  await page.setViewportSize({ width: 320, height: 360 });
  await page.locator('#reflection-note').fill('A reflection written with little room on screen.');
  await page.locator('[data-reflection-save]').click();
  await expect(page.locator('#reflection-status')).toContainText('saved on this device');
  expect(await page.locator('#deeper').evaluate(el => el.getBoundingClientRect().top >= 0 && el.getBoundingClientRect().bottom <= innerHeight + 1)).toBe(true);
  await page.screenshot({ path: test.info().outputPath('reflection-short-viewport.png') });
});

test.describe('installed offline reading', () => {
  test.use({ serviceWorkers: 'allow' });
  test('a cached reading view reopens offline', async ({ page, context }) => {
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await ready(page, '#s-birth'); await page.locator('#reading-toggle').click();
    await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller != null)).toBe(true);
    await expect.poll(() => page.evaluate(async () => (await caches.keys()).some(k => k.startsWith('the-way-app-')))).toBe(true);
    await context.setOffline(true); await page.reload();
    await expect(page.locator('#reading-pane h2')).toContainText('manger');
    await page.locator('#scene-next').click(); await expect(page.locator('#reading-pane')).toContainText('Savior has been born');
    expect(errors).toEqual([]);
  });
});
