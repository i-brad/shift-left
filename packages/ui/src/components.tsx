import { useRef, type ButtonHTMLAttributes, type KeyboardEvent, type ReactNode } from 'react';
import type { Tone } from './tokens';

export function Button({
  variant = 'outline',
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'outline' | 'primary' }) {
  return <button type="button" className={`sl-btn sl-btn--${variant} ${className}`} {...rest} />;
}

export function Chip({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className="sl-chip" data-tone={tone}>
      {children}
    </span>
  );
}

export function Metric({ label, value, tone = 'neutral' }: { label: string; value: ReactNode; tone?: Tone }) {
  return (
    <dl className="sl-metric" data-tone={tone} data-testid={`metric-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </dl>
  );
}

export type CalloutKind = 'key' | 'watch' | 'try' | 'goal';
const calloutTitle: Record<CalloutKind, string> = { key: 'Key idea', watch: 'Watch out', try: 'Try it', goal: 'Your goal' };

export function Callout({ kind, title, children }: { kind: CalloutKind; title?: string; children: ReactNode }) {
  return (
    <div className="sl-callout" data-kind={kind} role={kind === 'goal' ? 'status' : undefined}>
      <b>{title ?? calloutTitle[kind]}</b>
      {children}
    </div>
  );
}

export type RailStep = { label: string };

/** Step rail. Arrow keys move focus between steps; Enter or click selects. */
export function StepRail({
  steps,
  current,
  onSelect,
  isLocked,
}: {
  steps: RailStep[];
  current: number;
  onSelect: (i: number) => void;
  isLocked?: (i: number) => boolean;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent, i: number) => {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    e.stopPropagation();
    refs.current.at(Math.max(0, Math.min(steps.length - 1, i + d)))?.focus();
  };
  return (
    <ol className="sl-rail" aria-label="Lesson steps">
      {steps.map((s, i) => {
        const state = i < current ? 'done' : i === current ? 'current' : 'todo';
        const locked = isLocked?.(i) ?? false;
        return (
          <li key={s.label}>
            <button
              ref={(el) => {
                refs.current[i] = el;
              }}
              data-state={state}
              aria-current={i === current ? 'step' : undefined}
              aria-label={`Step ${i + 1}: ${s.label}${locked ? ' (locked)' : ''}`}
              disabled={locked}
              onClick={() => onSelect(i)}
              onKeyDown={(e) => onKey(e, i)}
            >
              <i>{i + 1}</i>
              {s.label}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

export function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  return (
    <div className="sl-progress" role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <span style={{ width: `${(value / max) * 100}%` }} />
    </div>
  );
}

/** Two-or-more option switch, e.g. the validator's `<` vs `<=`. */
export function Toggle<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="sl-toggle" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o} type="button" aria-pressed={o === value} onClick={() => onChange(o)}>
          {o}
        </button>
      ))}
    </div>
  );
}
