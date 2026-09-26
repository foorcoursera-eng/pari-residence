/* Проверки собранного сайта в браузере: npm test (сборка + тесты).
   Браузер — Chromium из Playwright (npx playwright install chromium) или уже установленный:
   путь к нему — в PW_CHROMIUM (например, /opt/pw-browsers/chromium). */
import { defineConfig, devices } from '@playwright/test';

const PORT = 4399;
export default defineConfig({
  testDir: 'tests',
  testMatch: /.*\.spec\.mjs/,
  timeout: 60_000,
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: `node tests/serve.mjs`,
    env: { PORT: String(PORT), ...(process.env.DIST ? { DIST: process.env.DIST } : {}) },
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
  },
});
