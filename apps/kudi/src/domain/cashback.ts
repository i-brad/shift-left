import { plant, type Bugs } from '../bugs';
import type { Tier } from './fees';

/** See SPEC.md → Cashback. Basic: none. Plus: 1%, doubled to 2% over ₦100,000. */
export function cashback(tier: Tier, amount: number, bugs: Bugs): number {
  let rate: number | undefined = plant<number | undefined>(bugs, 'cashback-basic-undefined', undefined, 0);
  if (tier === 'plus') {
    rate = 0.01;
  }
  if (amount > 100_000) {
    rate = (rate as number) * 2;
  }
  return Math.round(amount * (rate as number));
}
