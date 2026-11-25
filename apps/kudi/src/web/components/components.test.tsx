// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AmountInput, parseAmount } from './AmountInput';
import { CardPanel } from './CardPanel';
import { TransferForm } from './TransferForm';

describe('parseAmount', () => {
  it.each([
    ['500000', 500_000],
    ['500,000', 500_000],
    ['₦ 5,000', 5000],
  ])('reads %s', (raw, n) => expect(parseAmount(raw)).toBe(n));

  it('turns blank and text into NaN', () => {
    expect(parseAmount('')).toBeNaN();
    expect(parseAmount('abc')).toBeNaN();
  });
});

describe('AmountInput', () => {
  it('links its error to the field for screen readers', () => {
    render(<AmountInput value="99" onChange={() => {}} error="Minimum is ₦100" />);
    const input = screen.getByLabelText('Amount');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Minimum is ₦100');
  });
});

describe('TransferForm', () => {
  const fill = async (to: string, amount: string) => {
    await userEvent.type(screen.getByLabelText('Recipient email'), to);
    await userEvent.type(screen.getByLabelText('Amount'), amount);
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));
  };

  it('sends the parsed amount and confirms', async () => {
    const onSend = vi.fn().mockResolvedValue({});
    render(<TransferForm onSend={onSend} />);
    await fill('tunde@kudi.test', '5,000');
    expect(onSend).toHaveBeenCalledWith('tunde@kudi.test', 5000, false);
    expect(await screen.findByRole('status')).toHaveTextContent('Sent ₦5,000 to tunde@kudi.test');
  });

  it('shows an amount error under the amount field', async () => {
    render(<TransferForm onSend={vi.fn().mockRejectedValue({ status: 422, error: 'AMOUNT_ABOVE_LIMIT' })} />);
    await fill('tunde@kudi.test', '900000');
    expect(await screen.findByText('Amount exceeds limit')).toBeInTheDocument();
    expect(screen.getByLabelText('Amount')).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows a recipient error under the recipient field', async () => {
    render(<TransferForm onSend={vi.fn().mockRejectedValue({ status: 422, error: 'RECIPIENT_NOT_FOUND' })} />);
    await fill('nobody@kudi.test', '500');
    expect(await screen.findByText('No Kudi account with that email')).toBeInTheDocument();
    expect(screen.getByLabelText('Recipient email')).toHaveAttribute('aria-invalid', 'true');
  });

  it('ignores a double click while sending', async () => {
    let resolve!: () => void;
    const onSend = vi.fn(() => new Promise<void>((r) => (resolve = r)));
    render(<TransferForm onSend={onSend} />);
    await userEvent.type(screen.getByLabelText('Recipient email'), 'tunde@kudi.test');
    await userEvent.type(screen.getByLabelText('Amount'), '500');
    await userEvent.dblClick(screen.getByRole('button', { name: 'Send' }));
    resolve();
    expect(onSend).toHaveBeenCalledTimes(1);
  });
});

describe('TransferForm express', () => {
  it('sends express and shows the fee', async () => {
    const onSend = vi.fn().mockResolvedValue({ fee: 100 });
    render(<TransferForm onSend={onSend} />);
    await userEvent.type(screen.getByLabelText('Recipient email'), 'ada@kudi.test');
    await userEvent.type(screen.getByLabelText('Amount'), '1000');
    await userEvent.click(screen.getByLabelText('Express delivery'));
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSend).toHaveBeenCalledWith('ada@kudi.test', 1000, true);
    expect(await screen.findByRole('status')).toHaveTextContent('Sent ₦1,000 to ada@kudi.test (fee ₦100)');
  });
});

describe('CardPanel', () => {
  it('only offers actions that fit the state', () => {
    const { rerender } = render(<CardPanel state="active" onAction={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Unfreeze' })).toBeNull();
    rerender(<CardPanel state="blocked" onAction={vi.fn()} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('explains a refused action', async () => {
    render(<CardPanel state="active" onAction={vi.fn().mockRejectedValue({ status: 409, error: 'INVALID_TRANSITION' })} />);
    await userEvent.click(screen.getByRole('button', { name: 'Freeze' }));
    expect(await screen.findByRole('alert')).toHaveTextContent("You can't freeze a active card");
  });
});

describe('TransferForm redesign', () => {
  it('keeps the labels, roles and test id, and changes the rest', () => {
    const { container } = render(<TransferForm onSend={async () => ({})} redesign />);
    expect(screen.getByLabelText('Recipient email')).toHaveAttribute('id', 'recipient-input');
    expect(screen.getByRole('button', { name: /send/i })).toHaveTextContent('Send money');
    expect(screen.getByTestId('send-button')).toBeInTheDocument();
    expect(container.querySelector('.transfer')).toBeNull();
    const labels = [...container.querySelectorAll('label')].map((l) => l.textContent);
    expect(labels.indexOf('Amount')).toBeLessThan(labels.indexOf('Recipient email'));
  });
});
