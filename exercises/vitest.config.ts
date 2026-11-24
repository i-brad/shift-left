import { defineConfig } from 'vitest/config';

/** Unit-test exercises (runner: "vitest"). Use: pnpm exercise <name> [--fixed] [--solution] */
const exercise = process.env.EXERCISE ?? '05-coverage';
const solution = !!process.env.SOLUTION;

export default defineConfig({
  test: {
    include: [solution ? `${exercise}/solution/**/*.test.ts` : `${exercise}/*.test.ts`],
    coverage: {
      enabled: true,
      provider: 'istanbul',
      allowExternal: true,
      include: ['**/apps/kudi/src/domain/cashback.ts'],
      reporter: ['text', 'html'],
      reportsDirectory: `./${exercise}/coverage`,
      thresholds: { branches: 100, statements: 100 },
    },
  },
});
