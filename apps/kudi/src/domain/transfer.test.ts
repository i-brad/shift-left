import { describe, expect, it } from 'vitest';
import { bugsFrom, parseBugs } from '../bugs';
import { formatNaira, validateAmount } from './transfer';

describe('validateAmount (spec)', () => {
  it.each([
    [100, true],
    [5000, true],
    [500_000, true],
  ])('accepts ₦%i', (amount) => {
    expect(validateAmount(amount)).toEqual({ ok: true, amount });
  });

  it.each([
    [99, 'AMOUNT_BELOW_MIN'],
    [0, 'AMOUNT_BELOW_MIN'],
    [-500, 'AMOUNT_BELOW_MIN'],
    [500_001, 'AMOUNT_ABOVE_LIMIT'],
    [100.5, 'AMOUNT_INVALID'],
    ['5000', 'AMOUNT_INVALID'],
    [undefined, 'AMOUNT_INVALID'],
    [Number.NaN, 'AMOUNT_INVALID'],
  ])('rejects %s with %s', (amount, error) => {
    expect(validateAmount(amount)).toEqual({ ok: false, error });
  });
});

describe('limit-exclusive bug', () => {
  const bugs = bugsFrom(['limit-exclusive']);

  it('rejects exactly ₦500,000', () => {
    expect(validateAmount(500_000, bugs)).toEqual({ ok: false, error: 'AMOUNT_ABOVE_LIMIT' });
  });

  it('still accepts ₦499,999, so only a boundary test notices', () => {
    expect(validateAmount(499_999, bugs).ok).toBe(true);
  });
});

describe('parseBugs', () => {
  it('reads a comma list', () => {
    expect([...parseBugs(' limit-exclusive ,')]).toEqual(['limit-exclusive']);
  });

  it('refuses names it does not know', () => {
    expect(() => parseBugs('nope')).toThrow(/Unknown KUDI_BUGS: nope/);
  });
});

describe('formatNaira', () => {
  it('groups thousands', () => {
    expect(formatNaira(500_000)).toBe('₦500,000');
  });
});
