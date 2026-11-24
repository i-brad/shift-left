import { describe, expect, it } from 'vitest';
import { ALL_TRANSITIONS, INVALID_TRANSITIONS, VALID_TRANSITIONS, codeNext, runCard } from './card';
import { ALL_COMBOS, FEE_RULES, codeFee, ruleOf, runFees, specFee } from './fees';

describe('fees', () => {
  it('has 8 combinations that collapse into 5 rules', () => {
    expect(ALL_COMBOS).toHaveLength(8);
    expect(new Set(ALL_COMBOS.map(ruleOf)).size).toBe(FEE_RULES.length);
  });

  it('express ignores the amount for Basic', () => {
    expect(specFee({ tier: 'basic', band: 'low', express: true })).toBe(specFee({ tier: 'basic', band: 'high', express: true }));
  });

  it('the express-first bug overcharges only Plus express', () => {
    const run = runFees({ order: 'express-first' }, ALL_COMBOS);
    expect(run.results.filter((r) => !r.passed).map((r) => r.id).sort()).toEqual(['plus-high-express', 'plus-low-express']);
    expect(codeFee({ order: 'express-first' }, { tier: 'plus', band: 'low', express: true })).toBe(100);
  });

  it('one-factor-at-a-time testing misses the bug', () => {
    const ofat = [
      { tier: 'basic', band: 'low', express: false },
      { tier: 'plus', band: 'low', express: false },
      { tier: 'basic', band: 'high', express: false },
      { tier: 'basic', band: 'low', express: true },
    ] as const;
    expect(runFees({ order: 'express-first' }, ofat).metrics).toMatchObject({ failing: 0, combosCovered: 4 });
  });

  it('is all green once fixed', () => {
    expect(runFees({ order: 'tier-first' }, ALL_COMBOS).metrics.failing).toBe(0);
  });
});

describe('card', () => {
  it('has 9 state × action pairs: 4 valid, 5 invalid', () => {
    expect(ALL_TRANSITIONS).toHaveLength(9);
    expect(VALID_TRANSITIONS).toHaveLength(4);
    expect(INVALID_TRANSITIONS).toHaveLength(5);
  });

  it('testing only valid transitions misses the bug', () => {
    expect(runCard({ bug: true }, VALID_TRANSITIONS).metrics.failing).toBe(0);
  });

  it('the bug lets a blocked card be unfrozen', () => {
    expect(codeNext({ bug: true }, { from: 'blocked', action: 'unfreeze' })).toBe('active');
    const run = runCard({ bug: true }, ALL_TRANSITIONS);
    expect(run.results.filter((r) => !r.passed).map((r) => r.id)).toEqual(['blocked:unfreeze']);
    expect(run.metrics).toMatchObject({ validCovered: 4, invalidCovered: 5 });
  });

  it('is all green once fixed', () => {
    expect(runCard({ bug: false }, ALL_TRANSITIONS).metrics.failing).toBe(0);
  });
});
