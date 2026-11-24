import { describe, expect, it } from 'vitest';
import { bugsFrom, parseBugs } from '../../../apps/kudi/src/bugs';
import { cashback } from '../../../apps/kudi/src/domain/cashback';

/**
 * Reference solution for exercise 05: every branch, expected values from the spec.
 * Each row: [tier, amount, expected cashback from SPEC.md]
 */
const cases: [tier: 'basic' | 'plus', amount: number, expected: number][] = [
  ['plus', 200_000, 4000], // tier true, big true
  ['plus', 5000, 50],      // tier true, big false
  ['basic', 5000, 0],      // tier false, big false  ← NaN with the bug on
  ['basic', 200_000, 0],   // tier false, big true   ← NaN with the bug on
  ['plus', 100_000, 1000], // boundary: not over ₦100,000
];

const bugs = bugsFrom(parseBugs(process.env.KUDI_BUGS));

describe('cashback', () => {
  it.each(cases)('%s ₦%i → ₦%i', (tier, amount, expected) => {
    expect(cashback(tier, amount, bugs)).toBe(expected);
  });
});
