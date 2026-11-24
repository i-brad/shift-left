import { expect, test } from '@playwright/test';

/**
 * Exercise 02 · Boundaries
 * Add rows to `cases` until this file finds Kudi's bug. See README.md.
 *
 * Each row: [amount, expected HTTP status, expected error code or null]
 */
const cases: [amount: number, status: number, error: string | null][] = [
  [5000, 201, null], // happy path: a valid amount
  // TODO: one value from each partition (too small, too big)
  // TODO: both sides of the minimum edge
  // TODO: both sides of the maximum edge
];

test.beforeEach(async ({ request }) => {
  await request.post('/api/test/reset');
  const login = await request.post('/api/sessions', { data: { email: 'ada@kudi.test', password: 'kudi-ada-pass' } });
  expect(login.status()).toBe(201);
});

for (const [amount, status, error] of cases) {
  test(`transfer ₦${amount.toLocaleString('en-NG')} → ${status}${error ? ` ${error}` : ''}`, async ({ request }) => {
    const res = await request.post('/api/transfers', { data: { to: 'tunde@kudi.test', amount } });
    expect(res.status()).toBe(status);
    if (error) expect(await res.json()).toEqual({ error });
  });
}
