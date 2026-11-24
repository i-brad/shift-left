/**
 * Boundary simulation: a transfer-amount validator with an optional off-by-one bug.
 * Pure functions only — the lesson scene, the Lab and the tests all call these.
 */

export type MaxOperator = '<' | '<=';

export type BoundaryModel = {
  /** Smallest allowed amount in naira (inclusive, per spec). */
  min: number;
  /** Largest allowed amount in naira (inclusive, per spec). */
  max: number;
  /** What the code actually does at the maximum. The spec always means '<='. */
  maxOperator: MaxOperator;
};

export type Partition = 'below' | 'valid' | 'above';

export type ProbeResult = {
  amount: number;
  partition: Partition;
  /** What the spec says should happen. */
  expected: boolean;
  /** What the validator actually did. */
  actual: boolean;
  passed: boolean;
};

export type BoundaryRun = {
  results: ProbeResult[];
  metrics: {
    tests: number;
    failing: number;
    /** Distinct partitions with at least one probe (0–3). */
    groupsCovered: number;
    /** Edge values probed out of [min-1, min, max, max+1] (0–4). */
    edgesCovered: number;
    /** Illustrative UI-suite time: ~0.3 s per browser test plus startup. */
    suiteSeconds: number;
  };
};

export const DEFAULT_MODEL: BoundaryModel = { min: 100, max: 500_000, maxOperator: '<' };

export function partitionOf(model: BoundaryModel, amount: number): Partition {
  if (amount < model.min) return 'below';
  if (amount > model.max) return 'above';
  return 'valid';
}

/** The requirement: min ≤ amount ≤ max. */
export function specAccepts(model: BoundaryModel, amount: number): boolean {
  return amount >= model.min && amount <= model.max;
}

/** The implementation under test, including the planted bug when maxOperator is '<'. */
export function validatorAccepts(model: BoundaryModel, amount: number): boolean {
  const underMax = model.maxOperator === '<=' ? amount <= model.max : amount < model.max;
  return amount >= model.min && underMax;
}

export function probe(model: BoundaryModel, amount: number): ProbeResult {
  const expected = specAccepts(model, amount);
  const actual = validatorAccepts(model, amount);
  return { amount, partition: partitionOf(model, amount), expected, actual, passed: expected === actual };
}

export function edgeValues(model: BoundaryModel): number[] {
  return [model.min - 1, model.min, model.max, model.max + 1];
}

export function run(model: BoundaryModel, amounts: readonly number[]): BoundaryRun {
  const results = amounts.map((a) => probe(model, a));
  const groups = new Set(results.map((r) => r.partition));
  const probed = new Set(amounts);
  const edgesCovered = edgeValues(model).filter((e) => probed.has(e)).length;
  return {
    results,
    metrics: {
      tests: amounts.length,
      failing: results.filter((r) => !r.passed).length,
      groupsCovered: groups.size,
      edgesCovered,
      suiteSeconds: amounts.length === 0 ? 0 : Math.round((0.1 + amounts.length * 0.3) * 10) / 10,
    },
  };
}

/** Deterministic pseudo-random amounts (log-uniform inside the valid range) for the "volume" step. */
export function randomAmounts(count: number, seed = 42, lo = 150, hi = 420_000): number[] {
  let s = seed;
  const next = () => (s = (s * 16807) % 2147483647) / 2147483647;
  return Array.from({ length: count }, () =>
    Math.round(Math.exp(Math.log(lo) + next() * (Math.log(hi) - Math.log(lo)))),
  );
}

/** Odds that `n` uniform random whole-naira tests in [min, max] hit one specific value at least once. */
export function chanceOfHitting(model: BoundaryModel, n: number): number {
  const size = model.max - model.min + 1;
  return 1 - Math.pow(1 - 1 / size, n);
}
