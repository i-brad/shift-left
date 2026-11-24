import { expect, test } from '@playwright/test';

/**
 * Reference solution for exercise 02. Partitions + two-value boundaries + a few extra partitions.
 * With the bug on, exactly one case fails: ₦500,000.
 */
const cases: [amount: number | string, status: number, error: string | null][] = [
  // One value per partition
  [50, 422, 'AMOUNT_BELOW_MIN'],
  [5000, 201, null],
  [900_000, 422, 'AMOUNT_ABOVE_LIMIT'],
  // Both sides of each edge
  [99, 422, 'AMOUNT_BELOW_MIN'],
  [100, 201, null],
  [500_000, 201, null],
  [500_001, 422, 'AMOUNT_ABOVE_LIMIT'],
  // Partitions the spec mentions that people forget
  [0, 422, 'AMOUNT_BELOW_MIN'],
  [-500, 422, 'AMOUNT_BELOW_MIN'],
  [100.5, 422, 'AMOUNT_INVALID'],
  ['5000', 422, 'AMOUNT_INVALID'],
];

test.beforeEach(async ({ request }) => {
  await request.post('/api/test/reset');
  const login = await request.post('/api/sessions', { data: { email: 'ada@kudi.test', password: 'kudi-ada-pass' } });
  expect(login.status()).toBe(201);
});

for (const [amount, status, error] of cases) {
  test(`transfer ${JSON.stringify(amount)} → ${status}${error ? ` ${error}` : ''}`, async ({ request }) => {
    const res = await request.post('/api/transfers', { data: { to: 'tunde@kudi.test', amount } });
    expect(res.status()).toBe(status);
    if (error) expect(await res.json()).toEqual({ error });
  });
}
