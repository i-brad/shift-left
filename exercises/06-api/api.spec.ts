import { expect, test, type APIRequestContext } from '@playwright/test';

/**
 * Exercise 06 · API testing. Module 3 in one file. See README.md.
 * Three bugs are on. These tests all pass anyway. Make each section catch its bug.
 */

type Who = 'ada' | 'tunde' | 'bola';
async function logInAs(request: APIRequestContext, who: Who) {
  const res = await request.post('/api/sessions', { data: { email: `${who}@kudi.test`, password: `kudi-${who}-pass` } });
  expect(res.status()).toBe(201);
}

test.beforeEach(async ({ request }) => {
  await request.post('/api/test/reset');
});

test.describe('asserting on responses', () => {
  test('history lists a sent transfer', async ({ request }) => {
    await logInAs(request, 'ada');
    await request.post('/api/transfers', { data: { to: 'tunde@kudi.test', amount: 5000 } });
    const res = await request.get('/api/transfers');
    expect(res.status()).toBe(200);
    // TODO: assert the shape of each item: id, direction, counterparty, amount, createdAt, and their types.
    // TODO: assert the values that matter for this transfer.
  });
});

test.describe('authorisation', () => {
  test('logged out, a transfer is 401', async ({ request }) => {
    const res = await request.get('/api/transfers/1');
    expect(res.status()).toBe(401);
  });

  test('the sender can read their transfer', async ({ request }) => {
    await logInAs(request, 'tunde');
    const sent = await (await request.post('/api/transfers', { data: { to: 'bola@kudi.test', amount: 1000 } })).json();
    const res = await request.get(`/api/transfers/${sent.id}`);
    expect(res.status()).toBe(200);
  });

  // TODO: someone who took no part (Ada) must not be able to read Tunde → Bola. What does SPEC.md say she gets?
});

test.describe('negative tests', () => {
  test('amount as text is refused', async ({ request }) => {
    await logInAs(request, 'ada');
    const res = await request.post('/api/transfers', { data: { to: 'tunde@kudi.test', amount: '5000' } });
    expect(res.status()).toBe(422);
    expect(await res.json()).toEqual({ error: 'AMOUNT_INVALID' });
  });

  // TODO: a missing amount, an amount above the limit, a body that isn't JSON, an empty body.
  // For a refused transfer, also check Ada's balance didn't change.
});
