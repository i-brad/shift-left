/**
 * Fee simulation for the Decision tables lesson.
 * Three conditions (tier, amount band, express) → 8 combinations → 5 rules once collapsed.
 */

export type Tier = 'basic' | 'plus';
export type Band = 'low' | 'high';
export type FeeCombo = { tier: Tier; band: Band; express: boolean };

/** Amount above which a Basic standard transfer costs more. */
export const FEE_THRESHOLD = 5000;
/** Representative amounts for each band. */
export const BAND_AMOUNT: Record<Band, number> = { low: 2000, high: 8000 };

/** 'express-first' is the planted bug: express is checked before tier, so Plus customers pay the Basic express fee. */
export type FeeOrder = 'tier-first' | 'express-first';
export type FeeModel = { order: FeeOrder };

export const FEE_RULES = [
  { id: 'R1', label: 'Plus, standard', when: 'tier = Plus, express = no', fee: 0 },
  { id: 'R2', label: 'Plus, express', when: 'tier = Plus, express = yes', fee: 50 },
  { id: 'R3', label: 'Basic, ≤ ₦5,000, standard', when: 'tier = Basic, amount ≤ ₦5,000, express = no', fee: 10 },
  { id: 'R4', label: 'Basic, > ₦5,000, standard', when: 'tier = Basic, amount > ₦5,000, express = no', fee: 25 },
  { id: 'R5', label: 'Basic, express', when: 'tier = Basic, express = yes (any amount)', fee: 100 },
] as const;
export type FeeRuleId = (typeof FEE_RULES)[number]['id'];

export const bandOf = (amount: number): Band => (amount > FEE_THRESHOLD ? 'high' : 'low');
export const comboId = (c: FeeCombo) => `${c.tier}-${c.band}-${c.express ? 'express' : 'standard'}`;

export function ruleOf(c: FeeCombo): FeeRuleId {
  if (c.tier === 'plus') return c.express ? 'R2' : 'R1';
  if (c.express) return 'R5';
  return c.band === 'high' ? 'R4' : 'R3';
}

/** What the spec says the fee is. */
export function specFee(c: FeeCombo): number {
  const r = FEE_RULES.find((x) => x.id === ruleOf(c))!;
  return r.fee;
}

/** What the code charges. With 'express-first' the express check shadows the tier check. */
export function codeFee(model: FeeModel, c: FeeCombo): number {
  if (model.order === 'tier-first') return specFee(c);
  if (c.express) return 100;
  if (c.tier === 'plus') return 0;
  return c.band === 'high' ? 25 : 10;
}

export const ALL_COMBOS: FeeCombo[] = (['basic', 'plus'] as const).flatMap((tier) =>
  (['low', 'high'] as const).flatMap((band) => [false, true].map((express) => ({ tier, band, express }))),
);

export type FeeResult = { combo: FeeCombo; id: string; rule: FeeRuleId; expected: number; actual: number; passed: boolean };

export function runFees(model: FeeModel, combos: readonly FeeCombo[]) {
  const results: FeeResult[] = combos.map((c) => {
    const expected = specFee(c);
    const actual = codeFee(model, c);
    return { combo: c, id: comboId(c), rule: ruleOf(c), expected, actual, passed: expected === actual };
  });
  return {
    results,
    metrics: {
      tests: combos.length,
      failing: results.filter((r) => !r.passed).length,
      combosCovered: new Set(results.map((r) => r.id)).size,
      rulesCovered: new Set(results.map((r) => r.rule)).size,
    },
  };
}
export type FeeRun = ReturnType<typeof runFees>;
