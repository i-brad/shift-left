import { noBugs, type Bugs } from '../bugs';

export type CardState = 'active' | 'frozen' | 'blocked';
export type CardAction = 'freeze' | 'unfreeze' | 'block';
export const CARD_ACTIONS: CardAction[] = ['freeze', 'unfreeze', 'block'];

const NEXT: Record<CardState, Partial<Record<CardAction, CardState>>> = {
  active: { freeze: 'frozen', block: 'blocked' },
  frozen: { unfreeze: 'active', block: 'blocked' },
  blocked: {},
};

/** See SPEC.md → Card. Returns the new state, or null if the move must be refused. */
export function nextCardState(state: CardState, action: CardAction, bugs: Bugs = noBugs): CardState | null {
  if (bugs.on('card-unblock') && action === 'unfreeze') return state !== 'active' ? 'active' : null;
  return NEXT[state][action] ?? null;
}
