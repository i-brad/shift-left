import { existsSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

/** Unit-test exercises (runner: "vitest"). Use: pnpm exercise <name> [--fixed] [--solution] */
const exercise = process.env.EXERCISE ?? '05-coverage';
const solution = !!process.env.SOLUTION;
/** Checker exercises (09-ci) have one check.test.ts that reads either your file or the solution's. */
const checker = existsSync(new URL(`./${exercise}/check.test.ts`, import.meta.url));

export default defineConfig({
  test: {
    include: [checker ? `${exercise}/check.test.ts` : solution ? `${exercise}/solution/**/*.test.ts` : `${exercise}/*.test.ts`],
    coverage: {
      enabled: exercise === '05-coverage',
      provider: 'istanbul',
      allowExternal: true,
      include: ['**/apps/kudi/src/domain/cashback.ts'],
      reporter: ['text', 'html'],
      reportsDirectory: `./${exercise}/coverage`,
      thresholds: { branches: 100, statements: 100 },
    },
  },
});
