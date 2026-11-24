import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Callout, Metric, StepRail, Toggle } from './components';

describe('Metric', () => {
  it('shows label and value with its tone', () => {
    render(<Metric label="Escaped bugs" value={1} tone="bad" />);
    const m = screen.getByTestId('metric-escaped-bugs');
    expect(m).toHaveAttribute('data-tone', 'bad');
    expect(m).toHaveTextContent('1');
  });
});

describe('Callout', () => {
  it('uses the default title for its kind', () => {
    render(<Callout kind="watch">Retries hide flakiness.</Callout>);
    expect(screen.getByText('Watch out')).toBeInTheDocument();
  });
});

describe('StepRail', () => {
  const steps = [{ label: 'One' }, { label: 'Two' }, { label: 'Three' }];

  it('marks the current step', () => {
    render(<StepRail steps={steps} current={1} onSelect={() => {}} />);
    expect(screen.getByRole('button', { name: 'Step 2: Two' })).toHaveAttribute('aria-current', 'step');
  });

  it('moves focus with arrow keys and selects on Enter', async () => {
    const onSelect = vi.fn();
    render(<StepRail steps={steps} current={0} onSelect={onSelect} />);
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}{Enter}');
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it('does not select a locked step', async () => {
    const onSelect = vi.fn();
    render(<StepRail steps={steps} current={0} onSelect={onSelect} isLocked={(i) => i > 1} />);
    expect(screen.getByRole('button', { name: /Step 3/ })).toBeDisabled();
  });
});

describe('Toggle', () => {
  it('reports the chosen option', async () => {
    const onChange = vi.fn();
    render(<Toggle label="Operator" options={['<', '<='] as const} value="<" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: '<=' }));
    expect(onChange).toHaveBeenCalledWith('<=');
    expect(screen.getByRole('button', { name: '<' })).toHaveAttribute('aria-pressed', 'true');
  });
});
