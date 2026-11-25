/**
 * A test suite running against one Kudi database: data setup, order, parallel workers, waits, retries.
 * Deterministic, so the lesson can say exactly which test fails and why.
 */

export type DataStrategy = 'shared' | 'reset' | 'fresh';
export type Order = 'written' | 'reversed' | 'shuffled';
export type Waits = 'sleep' | 'auto';

export type SuiteTest = {
  id: string;
  label: string;
  /** Account the test uses with the seed data. */
  account: 'ada' | 'tunde';
  /** Changes the account. Writers assert relative changes ("went down by ₦5,000"); others check exact values. */
  writes: boolean;
  seconds: number;
  /** Uses a fixed sleep; fails on slow runs unless waits are 'auto'. */
  sleeps?: boolean;
  /** Finds a real bug: fails every time, whatever you do. */
  realBug?: boolean;
  /** Can only reach the bug with data the seed doesn't have (needs a factory, i.e. data 'fresh'). */
  needsFactory?: boolean;
};

export type SuiteDef = { title: string; tests: SuiteTest[]; deadlineSeconds?: number };
export type SuiteOptions = { data: DataStrategy; order: Order; workers: number; waits: Waits; retries: number; runs: number };

export const DATA_STRATEGIES: { id: DataStrategy; label: string; cost: number }[] = [
  { id: 'shared', label: 'Shared seed data', cost: 0 },
  { id: 'reset', label: 'Reset DB before each test', cost: 1 },
  { id: 'fresh', label: 'Fresh user per test', cost: 0.5 },
];

export type Cause = 'data' | 'timing' | 'bug';
export type Attempt = { worker: number; start: number; end: number; passed: boolean; cause?: Cause };
export type TestOutcome = { id: string; status: 'passed' | 'failed' | 'flaky'; attempts: Attempt[]; cause?: Cause };
export type SuiteRun = { outcomes: TestOutcome[]; seconds: number };

/** Small deterministic hash → [0, 1). */
const rand = (...xs: (string | number)[]) => {
  let h = 2166136261;
  for (const c of xs.join('|')) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return ((h >>> 0) % 1000) / 1000;
};

function orderFor(tests: SuiteTest[], order: Order, run: number) {
  if (order === 'written') return tests;
  if (order === 'reversed') return [...tests].reverse();
  return [...tests].sort((a, b) => rand('o', run, a.id) - rand('o', run, b.id));
}

function runOnce(def: SuiteDef, o: SuiteOptions, run: number): SuiteRun {
  const overhead = DATA_STRATEGIES.find((d) => d.id === o.data)!.cost;
  const free = Array.from({ length: Math.max(1, o.workers) }, () => 0);
  const slots: { t: SuiteTest; worker: number; start: number; end: number }[] = [];
  for (const t of orderFor(def.tests, o.order, run)) {
    const worker = free.indexOf(Math.min(...free));
    const start = free[worker]!;
    const end = start + t.seconds + overhead;
    free[worker] = end;
    slots.push({ t, worker, start, end });
  }
  const firstAttempt = (s: (typeof slots)[number]): Attempt => {
    const base = { worker: s.worker, start: s.start, end: s.end };
    if (s.t.realBug && !(s.t.needsFactory && o.data !== 'fresh')) return { ...base, passed: false, cause: 'bug' };
    const clash = slots.some((w) => {
      if (w === s) return false;
      if (o.data === 'shared') return !s.t.writes && w.t.account === s.t.account && w.t.writes && w.start < s.start;
      if (o.data === 'reset') return w.start > s.start && w.start < s.end;
      return false;
    });
    if (clash) return { ...base, passed: false, cause: 'data' };
    if (s.t.sleeps && o.waits === 'sleep' && rand('w', run, s.t.id) > 0.6) return { ...base, passed: false, cause: 'timing' };
    return { ...base, passed: true };
  };
  let clock = Math.max(...free);
  const outcomes = slots.map((s): TestOutcome => {
    const attempts = [firstAttempt(s)];
    while (!attempts.at(-1)!.passed && attempts.length <= o.retries) {
      const prev = attempts.at(-1)!;
      // Retries run at the end, alone: data clashes go away; timing gets a new draw; real bugs stay.
      const passed = prev.cause === 'bug' ? false : prev.cause === 'timing' ? rand('r', run, s.t.id, attempts.length) <= 0.85 : true;
      const start = clock;
      clock += s.t.seconds + overhead;
      attempts.push({ worker: s.worker, start, end: clock, passed, cause: passed ? undefined : prev.cause });
    }
    const ok = attempts.at(-1)!.passed;
    return { id: s.t.id, status: ok ? (attempts.length > 1 ? 'flaky' : 'passed') : 'failed', attempts, cause: attempts[0]!.cause };
  });
  return { outcomes, seconds: Math.round(clock * 10) / 10 };
}

export function runSuite(def: SuiteDef, o: SuiteOptions) {
  const runs = Array.from({ length: Math.max(1, o.runs) }, (_, r) => runOnce(def, o, r));
  const perTest = def.tests.map((t) => {
    const outs = runs.map((r) => r.outcomes.find((x) => x.id === t.id)!);
    const red = outs.filter((x) => x.status === 'failed').length;
    const retried = outs.filter((x) => x.status === 'flaky').length;
    const verdict = red === 0 ? (retried > 0 ? 'hidden-flaky' : 'stable-pass') : red === outs.length ? 'stable-fail' : 'flaky';
    const causes = [...new Set(outs.map((x) => x.cause).filter(Boolean))] as Cause[];
    return { id: t.id, label: t.label, red, retried, verdict: verdict as 'stable-pass' | 'stable-fail' | 'flaky' | 'hidden-flaky', causes };
  });
  const last = runs.at(-1)!;
  const metrics = {
    tests: def.tests.length,
    failing: last.outcomes.filter((x) => x.status === 'failed').length,
    falseFailures: last.outcomes.filter((x) => x.status === 'failed' && x.cause !== 'bug').length,
    flaky: perTest.filter((p) => p.verdict === 'flaky').length,
    hiddenFlaky: perTest.filter((p) => p.verdict === 'hidden-flaky').length,
    realBugCaught: perTest.some((p) => p.verdict === 'stable-fail' && def.tests.find((t) => t.id === p.id)?.realBug),
    seconds: Math.max(...runs.map((r) => r.seconds)),
  };
  return { runs, last, perTest, metrics };
}
export type SuiteResult = ReturnType<typeof runSuite>;
