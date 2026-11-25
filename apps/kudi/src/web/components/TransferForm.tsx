import { Button } from '@shift-left/ui';
import { useState, type FormEvent } from 'react';
import { ERROR_MESSAGES, formatNaira, type TransferError } from '../../domain/transfer';
import type { ApiError } from '../api';
import { AmountInput, parseAmount } from './AmountInput';

const AMOUNT_ERRORS = new Set(['AMOUNT_BELOW_MIN', 'AMOUNT_ABOVE_LIMIT', 'AMOUNT_INVALID', 'INSUFFICIENT_FUNDS']);

/** Set KUDI_REDESIGN=1 to serve the redesigned form: new markup, ids, classes and order; same labels, roles and test ids. */
const REDESIGN = (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.KUDI_REDESIGN === '1';

export function TransferForm({ onSend, redesign = REDESIGN }: { onSend: (to: string, amount: number, express: boolean) => Promise<{ fee?: number } | unknown>; redesign?: boolean }) {
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [express, setExpress] = useState(false);
  const [busy, setBusy] = useState(false);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [toError, setToError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setAmountError(null);
    setToError(null);
    setSent(null);
    const n = parseAmount(amount);
    try {
      const res = (await onSend(to.trim(), n, express)) as { fee?: number } | undefined;
      const fee = res && typeof res.fee === 'number' ? ` (fee ${formatNaira(res.fee)})` : '';
      setSent(`Sent ${formatNaira(n)} to ${to.trim()}${fee}`);
      setAmount('');
    } catch (err) {
      const code = (err as ApiError).error as TransferError;
      const message = ERROR_MESSAGES[code] ?? 'Something went wrong. Try again.';
      if (AMOUNT_ERRORS.has(code)) setAmountError(message);
      else setToError(message);
    } finally {
      setBusy(false);
    }
  };

  const recipient = (
    <div className={redesign ? 'field field--recipient' : 'field'}>
      <label htmlFor={redesign ? 'recipient-input' : 'to'}>Recipient email</label>
      <input id={redesign ? 'recipient-input' : 'to'} name="to" type="email" autoComplete="off" value={to} onChange={(e) => setTo(e.target.value)} aria-invalid={!!toError} aria-describedby={toError ? 'to-error' : undefined} required />
      {toError && (
        <p id="to-error" className="field-error">
          {toError}
        </p>
      )}
    </div>
  );
  const amountField = <AmountInput value={amount} onChange={setAmount} error={amountError} />;
  const expressRow = (
    <label className="check-row">
      <input type="checkbox" checked={express} onChange={(e) => setExpress(e.target.checked)} />
      Express delivery
    </label>
  );
  const submitButton = (
    <Button type="submit" variant="primary" disabled={busy} data-testid="send-button">
      {busy ? 'Sending…' : redesign ? 'Send money' : 'Send'}
    </Button>
  );
  const done = sent && (
    <p className="success" role="status">
      {sent}
    </p>
  );

  if (redesign)
    return (
      <form className="card send-panel" onSubmit={submit} aria-labelledby="send-title" data-version="2">
        <div className="send-panel__head">
          <h2 id="send-title">Send money</h2>
        </div>
        <div className="send-panel__body">
          {amountField}
          {recipient}
          <div className="send-panel__row">
            {expressRow}
            {submitButton}
          </div>
        </div>
        {done}
      </form>
    );

  return (
    <form className="card transfer" onSubmit={submit} aria-labelledby="send-title">
      <h2 id="send-title">Send money</h2>
      <p className="hint">₦100 to ₦500,000 per transfer. Fees: see SPEC.md.</p>
      {recipient}
      {amountField}
      {expressRow}
      {submitButton}
      {done}
    </form>
  );
}
