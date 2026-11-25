/**
 * Waiting, not sleeping. The same test runs 10 times; each run the app takes a different time to respond.
 * A sleep waits a fixed time; an auto-wait polls until the thing is there (or a timeout).
 */

export type WaitStrategy = 'none' | 'sleep' | 'auto';
export const WAIT_STRATEGIES: { id: WaitStrategy; label: string; code: string }[] = [
  { id: 'none', label: 'Check at once', code: "expect(await balance.textContent()).toBe('₦595,000')" },
  { id: 'sleep', label: 'Sleep, then check', code: "await page.waitForTimeout(SLEEP);\nexpect(await balance.textContent()).toBe('₦595,000')" },
  { id: 'auto', label: 'Auto-wait', code: "await expect(balance).toHaveText('₦595,000')" },
];

/** How each of the 10 runs compares to typical latency: networks vary. */
export const RUN_SPREAD = [0.5, 0.7, 0.8, 1, 1, 1.1, 1.3, 1.5, 1.9, 2.6];
export const POLL_MS = 100;
export const TIMEOUT_MS = 5000;

export type TimingRun = { latency: number; waited: number; passed: boolean };

export function runTiming({ latencyMs, strategy, sleepMs, timeoutMs = TIMEOUT_MS }: { latencyMs: number; strategy: WaitStrategy; sleepMs: number; timeoutMs?: number }) {
  const runs: TimingRun[] = RUN_SPREAD.map((f) => {
    const latency = Math.round(latencyMs * f);
    if (strategy === 'none') return { latency, waited: 0, passed: latency === 0 };
    if (strategy === 'sleep') return { latency, waited: sleepMs, passed: latency <= sleepMs };
    const passed = latency <= timeoutMs;
    return { latency, waited: passed ? Math.ceil(latency / POLL_MS) * POLL_MS : timeoutMs, passed };
  });
  const passed = runs.filter((r) => r.passed).length;
  const waitedMs = runs.reduce((n, r) => n + r.waited, 0);
  return { runs, metrics: { runs: runs.length, passed, failed: runs.length - passed, flaky: passed > 0 && passed < runs.length, waitedSeconds: Math.round(waitedMs / 100) / 10, wastedSeconds: Math.round(runs.reduce((n, r) => n + Math.max(0, r.waited - r.latency), 0) / 100) / 10 } };
}
export type TimingResult = ReturnType<typeof runTiming>;

/** Load testing: N virtual users against Kudi; latency grows once users pass capacity. */
export const LOAD_STEPS = [10, 25, 50, 100, 200, 400];
export function runLoad({ users, capacity, thresholdMs }: { users: number; capacity: number; thresholdMs: number }) {
  const base = 120;
  const over = Math.max(0, users / capacity - 1);
  const p50 = Math.round(base * (1 + over * 2.2));
  const p95 = Math.round(base * 1.8 * (1 + over * 4));
  const errorPct = users > capacity * 2 ? Math.min(40, Math.round((users / capacity - 2) * 12)) : 0;
  return { users, p50, p95, errorPct, passed: p95 <= thresholdMs && errorPct < 1 };
}
export type LoadResult = ReturnType<typeof runLoad>;
