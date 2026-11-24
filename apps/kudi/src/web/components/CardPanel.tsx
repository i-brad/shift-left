import { Button } from '@shift-left/ui';
import { useState } from 'react';
import type { ApiError, CardState } from '../api';

const LABEL: Record<CardState, string> = { active: 'Active', frozen: 'Frozen', blocked: 'Blocked' };

/** Shows only the actions that make sense for the card's state. The API still has to refuse the rest. */
export function CardPanel({ state, onAction }: { state: CardState; onAction: (a: 'freeze' | 'unfreeze' | 'block') => Promise<unknown> }) {
  const [error, setError] = useState<string | null>(null);
  const act = async (a: 'freeze' | 'unfreeze' | 'block') => {
    setError(null);
    try {
      await onAction(a);
    } catch (e) {
      setError((e as ApiError).error === 'INVALID_TRANSITION' ? `You can't ${a} a ${state} card` : 'Something went wrong. Try again.');
    }
  };
  return (
    <section className="card card-panel" aria-labelledby="card-title">
      <h2 id="card-title">Your card</h2>
      <p className="big-state" data-testid="card-state" data-state={state}>
        {LABEL[state]}
      </p>
      <div className="row">
        {state === 'active' && <Button onClick={() => act('freeze')}>Freeze</Button>}
        {state === 'frozen' && <Button onClick={() => act('unfreeze')}>Unfreeze</Button>}
        {state !== 'blocked' && <Button onClick={() => act('block')}>Block card</Button>}
      </div>
      {state === 'blocked' && <p className="hint">Blocked cards can't be used again. Order a new one.</p>}
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
