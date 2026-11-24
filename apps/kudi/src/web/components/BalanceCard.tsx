import { Money } from './Money';

export function BalanceCard({ name, balance }: { name: string; balance: number }) {
  return (
    <section className="card balance" aria-labelledby="balance-title">
      <p className="hint">Hi {name}</p>
      <h2 id="balance-title">Balance</h2>
      <p className="big" data-testid="balance">
        <Money amount={balance} />
      </p>
    </section>
  );
}
