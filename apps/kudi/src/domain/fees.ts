import { noBugs, type Bugs } from '../bugs';

export type Tier = 'basic' | 'plus';

/** See SPEC.md → Fees. */
export function calculateFee(tier: Tier, amount: number, express: boolean, bugs: Bugs = noBugs): number {
  if (bugs.on('fee-express-first')) {
    if (express) return 100;
    if (tier === 'plus') return 0;
    return amount > 5000 ? 25 : 10;
  }
  if (tier === 'plus') return express ? 50 : 0;
  if (express) return 100;
  return amount > 5000 ? 25 : 10;
}
