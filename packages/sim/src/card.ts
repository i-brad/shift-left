/**
 * Card state machine for the State transitions lesson.
 * States: active, frozen, blocked. Actions: freeze, unfreeze, block.
 */

export type CardState = 'active' | 'frozen' | 'blocked';
export type CardAction = 'freeze' | 'unfreeze' | 'block';

export const CARD_STATES: CardState[] = ['active', 'frozen', 'blocked'];
export const CARD_ACTIONS: CardAction[] = ['freeze', 'unfreeze', 'block'];

/** The spec: the only allowed transitions. Everything else must be refused. */
const SPEC: Partial<Record<`${CardState}:${CardAction}`, CardState>> = {
  'active:freeze': 'frozen',
  'frozen:unfreeze': 'active',
  'active:block': 'blocked',
  'frozen:block': 'blocked',
};

/** 'blocked-unfreeze' is the planted bug: unfreeze only checks "not active", so a blocked card can be reactivated. */
export type CardModel = { bug: boolean };

export type Transition = { from: CardState; action: CardAction };
export const transitionId = (t: Transition) => `${t.from}:${t.action}` as const;

export function specNext(t: Transition): CardState | null {
  return SPEC[transitionId(t)] ?? null;
}

export function codeNext(model: CardModel, t: Transition): CardState | null {
  if (model.bug && t.from === 'blocked' && t.action === 'unfreeze') return 'active';
  return specNext(t);
}

export const ALL_TRANSITIONS: Transition[] = CARD_STATES.flatMap((from) => CARD_ACTIONS.map((action) => ({ from, action })));
export const VALID_TRANSITIONS = ALL_TRANSITIONS.filter((t) => specNext(t) !== null);
export const INVALID_TRANSITIONS = ALL_TRANSITIONS.filter((t) => specNext(t) === null);

export type CardResult = Transition & { id: string; valid: boolean; expected: CardState | null; actual: CardState | null; passed: boolean };

export function runCard(model: CardModel, transitions: readonly Transition[]) {
  const results: CardResult[] = transitions.map((t) => {
    const expected = specNext(t);
    const actual = codeNext(model, t);
    return { ...t, id: transitionId(t), valid: expected !== null, expected, actual, passed: expected === actual };
  });
  const ids = new Set(results.map((r) => r.id));
  return {
    results,
    metrics: {
      tests: transitions.length,
      failing: results.filter((r) => !r.passed).length,
      validCovered: VALID_TRANSITIONS.filter((t) => ids.has(transitionId(t))).length,
      invalidCovered: INVALID_TRANSITIONS.filter((t) => ids.has(transitionId(t))).length,
      statesVisited: new Set(results.flatMap((r) => [r.from, ...(r.actual ? [r.actual] : [])])).size,
    },
  };
}
export type CardRun = ReturnType<typeof runCard>;
