import { expect, test, type APIRequestContext } from '@playwright/test';

/**
 * Reference solution for exercise 03: the full 8-column table. With the bug on, both Plus + express rows fail.
 * Each row: [tier, amount, express, expected fee]
 */
const table: [tier: 'basic' | 'plus', amount: number, express: boolean, fee: number][] = [
  ['basic', 2000, false, 10],  // R3
  ['basic', 2000, true, 100],  // R5
  ['basic', 8000, false, 25],  // R4
  ['basic', 8000, true, 100],  // R5
  ['plus', 2000, false, 0],    // R1
  ['plus', 2000, true, 50],    // R2
  ['plus', 8000, false, 0],    // R1
  ['plus', 8000, true, 50],    // R2
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
