import { formatNaira } from '../../domain/transfer';

export function Money({ amount }: { amount: number }) {
  return <span className="money">{formatNaira(amount)}</span>;
}
