import { defineConfig, devices } from '@playwright/test';

const API = 8790;
const WEB = 5190;

/** Kudi's own e2e tests: bugs off, separate ports and database so they never touch your dev data. */
export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: `http://localhost:${WEB}`,
    trace: 'retain-on-failure',
    ...(process.env.PW_CHROME_PATH ? { launchOptions: { executablePath: process.env.PW_CHROME_PATH } } : {}),
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    { command: 'pnpm start:api', port: API, env: { KUDI_API_PORT: String(API), KUDI_DB: ':memory:', KUDI_BUGS: '' }, reuseExistingServer: false },
    { command: 'pnpm dev:web', port: WEB, env: { KUDI_API_PORT: String(API), KUDI_WEB_PORT: String(WEB) }, reuseExistingServer: false },
  ],
});
