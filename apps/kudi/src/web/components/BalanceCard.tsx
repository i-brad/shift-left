import { Money } from './Money';

export function BalanceCard({ name, balance, tier = 'basic' }: { name: string; balance: number; tier?: 'basic' | 'plus' }) {
  return (
    <section className="card balance" aria-labelledby="balance-title">
      <p className="hint">
        Hi {name} · <span data-testid="tier">{tier === 'plus' ? 'Plus' : 'Basic'}</span>
      </p>
      <h2 id="balance-title">Balance</h2>
      <p className="big" data-testid="balance">
        <Money amount={balance} />
      </p>
    </section>
  );
}
