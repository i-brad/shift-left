import { defineConfig } from '@playwright/test';
import { readFileSync } from 'node:fs';

/**
 * Runs one exercise against a fresh Kudi API. Use the runner instead of calling this directly:
 *   pnpm exercise 02-boundaries            your tests, planted bug ON
 *   pnpm exercise 02-boundaries --fixed    your tests, bug OFF
 *   pnpm exercise 02-boundaries --solution the reference solution
 */
const exercise = process.env.EXERCISE;
if (!exercise) throw new Error('Set EXERCISE, or run: pnpm exercise <name>');
const meta = JSON.parse(readFileSync(new URL(`./${exercise}/exercise.json`, import.meta.url), 'utf8')) as { bug: string; web?: boolean; env?: Record<string, string> };
const fixed = !!process.env.FIXED;
const bugs = fixed ? '' : meta.bug;
/** Extra switches (redesign, latency) count as part of "the bug" for this exercise. */
const extra = fixed ? {} : (meta.env ?? {});
const port = 8795;
const webPort = 5195;

export default defineConfig({
  testDir: `./${exercise}`,
  testMatch: process.env.SOLUTION ? 'solution/*.spec.ts' : '*.spec.ts',
  testIgnore: process.env.SOLUTION ? [] : ['solution/**'],
  reporter: [['list']],
  workers: 1,
  use: {
    baseURL: `http://localhost:${meta.web ? webPort : port}`,
    trace: 'retain-on-failure',
    ...(process.env.PW_CHROME_PATH ? { launchOptions: { executablePath: process.env.PW_CHROME_PATH } } : {}),
  },
  webServer: [
    {
      command: 'pnpm --filter kudi start:api',
      port,
      env: { KUDI_API_PORT: String(port), KUDI_DB: ':memory:', KUDI_BUGS: bugs, ...extra },
      reuseExistingServer: false,
      stdout: 'pipe',
    },
    ...(meta.web
      ? [{ command: 'pnpm --filter kudi dev:web', port: webPort, env: { KUDI_API_PORT: String(port), KUDI_WEB_PORT: String(webPort), ...extra }, reuseExistingServer: false }]
      : []),
  ],
});
