import { describe, expect, it } from 'vitest';
import { bugsFrom, parseBugs } from '../../apps/kudi/src/bugs';
import { cashback } from '../../apps/kudi/src/domain/cashback';

/**
 * Exercise 05 · Coverage. Add cases until branch coverage is 100%. See README.md.
 * Each row: [tier, amount, expected cashback from SPEC.md]
 */
const cases: [tier: 'basic' | 'plus', amount: number, expected: number][] = [
  ['plus', 200_000, 4000], // Plus over ₦100,000: 2%
  // TODO: add cases that take the other branches
];

const bugs = bugsFrom(parseBugs(process.env.KUDI_BUGS));

describe('cashback', () => {
  it.each(cases)('%s ₦%i → ₦%i', (tier, amount, expected) => {
    expect(cashback(tier, amount, bugs)).toBe(expected);
  });
});
