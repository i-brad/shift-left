import { noBugs, type Bugs } from '../bugs';

export const LIMITS = { min: 100, max: 500_000 } as const;

export type AmountError = 'AMOUNT_INVALID' | 'AMOUNT_BELOW_MIN' | 'AMOUNT_ABOVE_LIMIT';
export type TransferError = AmountError | 'INSUFFICIENT_FUNDS' | 'RECIPIENT_NOT_FOUND' | 'SAME_ACCOUNT';

export const ERROR_MESSAGES: Record<TransferError, string> = {
  AMOUNT_BELOW_MIN: 'Minimum is ₦100',
  AMOUNT_ABOVE_LIMIT: 'Amount exceeds limit',
  AMOUNT_INVALID: 'Enter a whole number of naira',
  INSUFFICIENT_FUNDS: 'Not enough money in your account',
  RECIPIENT_NOT_FOUND: 'No Kudi account with that email',
  SAME_ACCOUNT: "You can't send money to yourself",
};

export type Result<E> = { ok: true; amount: number } | { ok: false; error: E };

/** See SPEC.md → Sending money. */
export function validateAmount(amount: unknown, bugs: Bugs = noBugs): Result<AmountError> {
  if (typeof amount !== 'number' || !Number.isInteger(amount)) return { ok: false, error: 'AMOUNT_INVALID' };
  if (amount < LIMITS.min) return { ok: false, error: 'AMOUNT_BELOW_MIN' };
  const withinMax = bugs.on('limit-exclusive') ? amount < LIMITS.max : amount <= LIMITS.max;
  if (!withinMax) return { ok: false, error: 'AMOUNT_ABOVE_LIMIT' };
  return { ok: true, amount };
}

export function formatNaira(amount: number): string {
  return `${amount < 0 ? '-' : ''}₦${Math.abs(amount).toLocaleString('en-NG')}`;
}
