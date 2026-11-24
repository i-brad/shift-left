import { describe, expect, it } from 'vitest';
import { bugsFrom } from '../bugs';
import { nextCardState } from './card';
import { calculateFee } from './fees';

describe('calculateFee (spec)', () => {
  it.each([
    ['plus', 2000, false, 0],
    ['plus', 8000, false, 0],
    ['plus', 2000, true, 50],
    ['plus', 8000, true, 50],
    ['basic', 5000, false, 10],
    ['basic', 5001, false, 25],
    ['basic', 2000, true, 100],
    ['basic', 8000, true, 100],
  ] as const)('%s ₦%i express=%s → ₦%i', (tier, amount, express, fee) => {
    expect(calculateFee(tier, amount, express)).toBe(fee);
  });

  it('fee-express-first charges Plus express ₦100', () => {
    expect(calculateFee('plus', 2000, true, bugsFrom(['fee-express-first']))).toBe(100);
    expect(calculateFee('plus', 2000, false, bugsFrom(['fee-express-first']))).toBe(0);
  });
});

describe('nextCardState (spec)', () => {
  it.each([
    ['active', 'freeze', 'frozen'],
    ['active', 'unfreeze', null],
    ['active', 'block', 'blocked'],
    ['frozen', 'freeze', null],
    ['frozen', 'unfreeze', 'active'],
    ['frozen', 'block', 'blocked'],
    ['blocked', 'freeze', null],
    ['blocked', 'unfreeze', null],
    ['blocked', 'block', null],
  ] as const)('%s + %s → %s', (from, action, to) => {
    expect(nextCardState(from, action)).toBe(to);
  });

  it('card-unblock lets a blocked card be unfrozen', () => {
    expect(nextCardState('blocked', 'unfreeze', bugsFrom(['card-unblock']))).toBe('active');
  });
});
