/**
 * Coverage simulation for the Statement and branch coverage lesson.
 *
 *   L1  let rate;                         // bug: should be `let rate = 0;`
 *   L2  if (tier === 'plus') {
 *   L3    rate = 0.01;
 *       }
 *   L4  if (amount > 100000) {
 *   L5    rate = rate * 2;
 *       }
 *   L6  return Math.round(amount * rate);
 *
 * Spec: Basic earns no cashback. Plus earns 1%, doubled to 2% on amounts over ₦100,000.
 */

export type CovTier = 'basic' | 'plus';
export type CovTest = { tier: CovTier; amount: number };
export type Branch = 'tier:true' | 'tier:false' | 'big:true' | 'big:false';

export const STATEMENTS = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'] as const;
export type Statement = (typeof STATEMENTS)[number];
export const BRANCHES: Branch[] = ['tier:true', 'tier:false', 'big:true', 'big:false'];
export const BIG = 100_000;

export function specCashback(t: CovTest): number {
  if (t.tier === 'basic') return 0;
  return Math.round(t.amount * (t.amount > BIG ? 0.02 : 0.01));
}

/** Runs the code, recording what it executed. With `fixed: false`, Basic gets NaN. */
export function execute(t: CovTest, fixed: boolean) {
  const lines = new Set<Statement>(['L1', 'L2']);
  const branches = new Set<Branch>();
  let rate: number | undefined = fixed ? 0 : undefined;
  if (t.tier === 'plus') {
    branches.add('tier:true');
    lines.add('L3');
    rate = 0.01;
  } else branches.add('tier:false');
  lines.add('L4');
  if (t.amount > BIG) {
    branches.add('big:true');
    lines.add('L5');
    rate = (rate as number) * 2;
  } else branches.add('big:false');
  lines.add('L6');
  const value = Math.round(t.amount * (rate as number));
  return { lines, branches, value };
}

export const covTestId = (t: CovTest) => `${t.tier}-${t.amount}`;

export function runCoverage(tests: readonly CovTest[], fixed: boolean) {
  const lines = new Set<Statement>();
  const branches = new Set<Branch>();
  const results = tests.map((t) => {
    const r = execute(t, fixed);
    r.lines.forEach((l) => lines.add(l));
    r.branches.forEach((b) => branches.add(b));
    const expected = specCashback(t);
    return { ...t, id: covTestId(t), expected, actual: r.value, passed: Object.is(expected, r.value) };
  });
  return {
    results,
    lines,
    branches,
    metrics: {
      tests: tests.length,
      failing: results.filter((r) => !r.passed).length,
      statements: lines.size,
      statementPct: Math.round((lines.size / STATEMENTS.length) * 100),
      branchesCovered: branches.size,
      branchPct: Math.round((branches.size / BRANCHES.length) * 100),
    },
  };
}
export type CoverageRun = ReturnType<typeof runCoverage>;
