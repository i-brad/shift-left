import { useId } from 'react';

/** Naira amount field. Shows its own error under the input; digits only on mobile keyboards. */
export function AmountInput({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: string | null }) {
  const id = useId();
  const errId = `${id}-error`;
  return (
    <div className="field">
      <label htmlFor={id}>Amount</label>
      <div className="amount">
        <span aria-hidden="true">₦</span>
        <input
          id={id}
          name="amount"
          inputMode="numeric"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? errId : undefined}
        />
      </div>
      {error && (
        <p id={errId} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

/** "500,000" or "₦500000" → 500000. Anything else becomes NaN, so the API returns AMOUNT_INVALID. */
export function parseAmount(raw: string): number {
  const cleaned = raw.replace(/[₦,\s]/g, '');
  return cleaned === '' ? Number.NaN : Number(cleaned);
}
