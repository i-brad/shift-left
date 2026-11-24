import type { Transfer } from '../api';
import { Money } from './Money';

export function TransactionList({ items }: { items: Transfer[] }) {
  return (
    <section className="card history" aria-labelledby="history-title">
      <h2 id="history-title">History</h2>
      {items.length === 0 ? (
        <p className="hint">No transfers yet.</p>
      ) : (
        <ul>
          {items.map((t) => (
            <li key={t.id} data-testid="transaction">
              <span>{t.direction === 'out' ? `To ${t.counterparty}` : `From ${t.counterparty}`}</span>
              <b className={t.direction}>
                {t.direction === 'out' ? '−' : '+'}
                <Money amount={t.amount} />
              </b>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
