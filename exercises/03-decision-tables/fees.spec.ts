import { expect, test, type APIRequestContext } from '@playwright/test';

/**
 * Exercise 03 · Decision tables. Add one row per column of the fee table. See README.md.
 * Each row: [tier, amount, express, expected fee]
 */
const table: [tier: 'basic' | 'plus', amount: number, express: boolean, fee: number][] = [
  ['basic', 2000, false, 10], // Basic, up to ₦5,000, standard
  // TODO: the other 7 combinations
];

const ACCOUNTS = {
  basic: { email: 'tunde@kudi.test', password: 'kudi-tunde-pass' },
  plus: { email: 'ada@kudi.test', password: 'kudi-ada-pass' },
};

async function logInAs(request: APIRequestContext, tier: 'basic' | 'plus') {
  const res = await request.post('/api/sessions', { data: ACCOUNTS[tier] });
  expect(res.status()).toBe(201);
}

test.beforeEach(async ({ request }) => {
  await request.post('/api/test/reset');
});

for (const [tier, amount, express, fee] of table) {
  test(`${tier} ₦${amount} express=${express} → ₦${fee}`, async ({ request }) => {
    await logInAs(request, tier);
    const res = await request.get(`/api/fees?amount=${amount}&express=${express}`);
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ fee });
  });
}
