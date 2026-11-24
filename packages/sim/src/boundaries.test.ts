import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MODEL,
  chanceOfHitting,
  edgeValues,
  probe,
  randomAmounts,
  run,
  type BoundaryModel,
} from './boundaries';

const buggy: BoundaryModel = { ...DEFAULT_MODEL, maxOperator: '<' };
const fixed: BoundaryModel = { ...DEFAULT_MODEL, maxOperator: '<=' };

describe('probe', () => {
  it('passes the happy path even with the bug', () => {
    expect(probe(buggy, 5000)).toMatchObject({ expected: true, actual: true, passed: true });
  });

  it('fails exactly on the maximum when the operator is <', () => {
    expect(probe(buggy, 500_000)).toMatchObject({ expected: true, actual: false, passed: false });
  });

  it('passes on the maximum once fixed', () => {
    expect(probe(fixed, 500_000).passed).toBe(true);
  });

  it.each([
    [99, 'below', false],
    [100, 'valid', true],
    [500_001, 'above', false],
  ] as const)('classifies %i as %s', (amount, partition, expected) => {
    expect(probe(fixed, amount)).toMatchObject({ partition, expected, passed: true });
  });
});

describe('run', () => {
  it('one test per partition covers all groups but misses the bug', () => {
    const { metrics } = run(buggy, [50, 5000, 900_000]);
    expect(metrics).toMatchObject({ tests: 3, groupsCovered: 3, edgesCovered: 0, failing: 0 });
  });

  it('boundary values catch the bug', () => {
    const { metrics, results } = run(buggy, [50, 5000, 900_000, ...edgeValues(buggy)]);
    expect(metrics.edgesCovered).toBe(4);
    expect(metrics.failing).toBe(1);
    expect(results.find((r) => !r.passed)?.amount).toBe(500_000);
  });

  it('50 random tests stay in one group and find nothing', () => {
    const { metrics } = run(buggy, randomAmounts(50));
    expect(metrics.groupsCovered).toBe(1);
    expect(metrics.failing).toBe(0);
    expect(metrics.suiteSeconds).toBeGreaterThan(10);
  });

  it('random amounts are deterministic', () => {
    expect(randomAmounts(5)).toEqual(randomAmounts(5));
  });
});

describe('chanceOfHitting', () => {
  it('50 random tests have about a 0.01% chance of hitting one value', () => {
    expect(chanceOfHitting(DEFAULT_MODEL, 50)).toBeCloseTo(0.0001, 4);
  });

  it('about 346,000 tests give even odds', () => {
    expect(chanceOfHitting(DEFAULT_MODEL, 346_500)).toBeCloseTo(0.5, 2);
  });
});
