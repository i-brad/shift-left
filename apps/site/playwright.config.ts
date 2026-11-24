import { defineConfig, devices } from '@playwright/test';

/** E2E tests for the site itself: we practise what we teach. */
export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'retain-on-failure',
    ...(process.env.PW_CHROME_PATH ? { launchOptions: { executablePath: process.env.PW_CHROME_PATH } } : {}),
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ],
  webServer: { command: 'pnpm build && pnpm next start -p 3100', url: 'http://localhost:3100', reuseExistingServer: !process.env.CI, timeout: 180_000 },
});
