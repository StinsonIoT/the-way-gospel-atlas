const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './e2e', testMatch: '**/*.spec.cjs', fullyParallel: false, workers: 1,
  timeout: 45000, expect: { timeout: 12000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:4173', serviceWorkers: 'block', reducedMotion: 'reduce',
    channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'win32' ? 'chrome' : undefined),
    launchOptions: { args: ['--enable-unsafe-swiftshader'] }, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [{ name: 'phone', use: { viewport: { width: 390, height: 844 } } }, { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } }],
  webServer: { command: 'node tools/preview.cjs', url: 'http://127.0.0.1:4173', env: { PORT: '4173', HOST: '127.0.0.1' }, reuseExistingServer: !process.env.CI }
});
