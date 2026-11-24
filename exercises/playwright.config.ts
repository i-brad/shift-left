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
const meta = JSON.parse(readFileSync(new URL(`./${exercise}/exercise.json`, import.meta.url), 'utf8')) as { bug: string };
const bugs = process.env.FIXED ? '' : meta.bug;
const port = 8795;

export default defineConfig({
  testDir: `./${exercise}`,
  testMatch: process.env.SOLUTION ? 'solution/*.spec.ts' : '*.spec.ts',
  testIgnore: process.env.SOLUTION ? [] : ['solution/**'],
  reporter: [['list']],
  use: { baseURL: `http://localhost:${port}` },
  webServer: {
    command: 'pnpm --filter kudi start:api',
    port,
    env: { KUDI_API_PORT: String(port), KUDI_DB: ':memory:', KUDI_BUGS: bugs },
    reuseExistingServer: false,
    stdout: 'pipe',
  },
});
