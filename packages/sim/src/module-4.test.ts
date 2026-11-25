import { describe, expect, it } from 'vitest';
import { PAGE_ELEMENTS, placesToFix, runLoad, runLocators, runSuite, runTiming, type SuiteDef, type SuiteOptions } from './index';

describe('locators', () => {
  const best = { recipient: 'label', amount: 'label', send: 'role', balance: 'testid' } as const;
  it('user-facing locators hold through redesign and data changes', () => {
    expect(runLocators(best, ['redesign', 'data']).metrics).toMatchObject({ holding: 4, broken: 0 });
  });
  it('structural locators snap on redesign', () => {
    const r = runLocators({ recipient: 'xpath', amount: 'xpath', send: 'xpath', balance: 'xpath' }, ['redesign']);
    expect(r.metrics.broken).toBe(3);
  });
  it('text locator for the balance breaks when data changes', () => {
    expect(runLocators({ balance: 'text' }, ['data']).results.find((x) => x.id === 'balance')!.holds).toBe(false);
  });
  it('every element has a holding option', () => {
    for (const el of PAGE_ELEMENTS) expect(Object.values(el.options).some((o) => o!.breaks.length === 0)).toBe(true);
  });
  it('page objects turn N×broken edits into broken edits', () => {
    const bad = { recipient: 'css-id', amount: 'xpath', send: 'text' } as const;
    expect(placesToFix(bad, ['redesign'], 12, false)).toBe(36);
    expect(placesToFix(bad, ['redesign'], 12, true)).toBe(3);
  });
});

describe('timing', () => {
  it('no wait never passes when there is latency', () => {
    expect(runTiming({ latencyMs: 800, strategy: 'none', sleepMs: 0 }).metrics.passed).toBe(0);
  });
  it('a sleep tuned to the average is flaky', () => {
    const r = runTiming({ latencyMs: 800, strategy: 'sleep', sleepMs: 1000 });
    expect(r.metrics.flaky).toBe(true);
  });
  it('a long sleep passes but wastes time; auto-wait passes and wastes little', () => {
    const sleep = runTiming({ latencyMs: 800, strategy: 'sleep', sleepMs: 3000 });
    const auto = runTiming({ latencyMs: 800, strategy: 'auto', sleepMs: 0 });
    expect(sleep.metrics.passed).toBe(10);
    expect(auto.metrics.passed).toBe(10);
    expect(auto.metrics.waitedSeconds).toBeLessThan(sleep.metrics.waitedSeconds);
  });
  it('auto-wait still fails a real outage (timeout)', () => {
    expect(runTiming({ latencyMs: 4000, strategy: 'auto', sleepMs: 0 }).metrics.failed).toBeGreaterThan(0);
  });
  it('load: p95 grows past capacity', () => {
    expect(runLoad({ users: 50, capacity: 100, thresholdMs: 500 }).passed).toBe(true);
    expect(runLoad({ users: 400, capacity: 100, thresholdMs: 500 }).passed).toBe(false);
  });
});

const def: SuiteDef = {
  title: 't',
  tests: [
    { id: 'send', label: 'send', account: 'ada', writes: true, seconds: 3 },
    { id: 'balance', label: 'balance', account: 'ada', writes: false, seconds: 2 },
    { id: 'history', label: 'history', account: 'ada', writes: false, seconds: 2, sleeps: true },
    { id: 'limit', label: 'limit', account: 'tunde', writes: false, seconds: 2, realBug: true },
  ],
};
const o = (p: Partial<SuiteOptions> = {}): SuiteOptions => ({ data: 'shared', order: 'written', workers: 1, waits: 'auto', retries: 0, runs: 1, ...p });

describe('suite', () => {
  it('shared data: a reader after a writer on the same account fails', () => {
    const r = runSuite(def, o());
    expect(r.last.outcomes.find((x) => x.id === 'balance')).toMatchObject({ status: 'failed', cause: 'data' });
  });
  it('order matters with shared data', () => {
    expect(runSuite(def, o({ order: 'reversed' })).last.outcomes.find((x) => x.id === 'balance')!.status).toBe('passed');
  });
  it('reset per test: fine alone, broken in parallel', () => {
    expect(runSuite(def, o({ data: 'reset' })).metrics.falseFailures).toBe(0);
    expect(runSuite(def, o({ data: 'reset', workers: 2 })).metrics.falseFailures).toBeGreaterThan(0);
  });
  it('fresh users: no false failures in parallel, real bug still caught', () => {
    const r = runSuite(def, o({ data: 'fresh', workers: 4 }));
    expect(r.metrics).toMatchObject({ falseFailures: 0, failing: 1, realBugCaught: true });
  });
  it('sleeps are flaky across 10 runs; retries hide it; auto-wait fixes it', () => {
    const base = { data: 'fresh', runs: 10 } as const;
    expect(runSuite(def, o({ ...base, waits: 'sleep' })).metrics.flaky).toBe(1);
    expect(runSuite(def, o({ ...base, waits: 'sleep', retries: 2 })).metrics).toMatchObject({ flaky: 0, hiddenFlaky: 1 });
    expect(runSuite(def, o({ ...base, waits: 'auto' })).metrics).toMatchObject({ flaky: 0, hiddenFlaky: 0, realBugCaught: true });
  });
});
