import { expect, test, type APIRequestContext } from '@playwright/test';

/** Reference solution for exercise 06. With the bugs on, four tests fail: one for each of the first two bugs, two (broken and empty body) for the third. */

type Who = 'ada' | 'tunde' | 'bola';
async function logInAs(request: APIRequestContext, who: Who) {
  const res = await request.post('/api/sessions', { data: { email: `${who}@kudi.test`, password: `kudi-${who}-pass` } });
  expect(res.status()).toBe(201);
}
const balance = async (request: APIRequestContext) => (await (await request.get('/api/me')).json()).balance as number;

test.beforeEach(async ({ request }) => {
  await request.post('/api/test/reset');
});

test.describe('asserting on responses', () => {
  test('history lists a sent transfer, with the right shape and values', async ({ request }) => {
    await logInAs(request, 'ada');
    await request.post('/api/transfers', { data: { to: 'tunde@kudi.test', amount: 5000 } });
    const res = await request.get('/api/transfers');
    expect(res.status()).toBe(200);
    const items = await res.json();
    expect(Array.isArray(items)).toBe(true);
    for (const t of items) {
      expect(t).toEqual({
        id: expect.any(Number),
        direction: expect.stringMatching(/^(in|out)$/),
        counterparty: expect.any(String),
        amount: expect.any(Number),
        createdAt: expect.any(String),
      });
    }
    expect(items[0]).toMatchObject({ direction: 'out', counterparty: 'tunde@kudi.test', amount: 5000 });
  });
});

test.describe('authorisation', () => {
  let id = 0;
  test.beforeEach(async ({ request }) => {
    await logInAs(request, 'tunde');
    id = (await (await request.post('/api/transfers', { data: { to: 'bola@kudi.test', amount: 1000 } })).json()).id;
  });

  test('logged out, a transfer is 401', async ({ playwright, baseURL }) => {
    const anon = await playwright.request.newContext({ baseURL });
    expect((await anon.get(`/api/transfers/${id}`)).status()).toBe(401);
    await anon.dispose();
  });

  test('the sender and the recipient can read it', async ({ request }) => {
    expect((await request.get(`/api/transfers/${id}`)).status()).toBe(200);
    await logInAs(request, 'bola');
    expect(await (await request.get(`/api/transfers/${id}`)).json()).toMatchObject({ direction: 'in', counterparty: 'tunde@kudi.test' });
  });

  test('someone who took no part gets 404', async ({ request }) => {
    await logInAs(request, 'ada');
    const res = await request.get(`/api/transfers/${id}`);
    expect(res.status()).toBe(404);
    expect(await res.json()).toEqual({ error: 'NOT_FOUND' });
  });

  test('an id that does not exist is 404', async ({ request }) => {
    expect((await request.get('/api/transfers/999999')).status()).toBe(404);
  });
});

test.describe('negative tests', () => {
  test.beforeEach(async ({ request }) => logInAs(request, 'ada'));

  const refusals: [name: string, data: unknown, error: string][] = [
    ['amount as text', { to: 'tunde@kudi.test', amount: '5000' }, 'AMOUNT_INVALID'],
    ['missing amount', { to: 'tunde@kudi.test' }, 'AMOUNT_INVALID'],
    ['amount above the limit', { to: 'tunde@kudi.test', amount: 500_001 }, 'AMOUNT_ABOVE_LIMIT'],
    ['unknown recipient', { to: 'nobody@kudi.test', amount: 5000 }, 'RECIPIENT_NOT_FOUND'],
  ];
  for (const [name, data, error] of refusals) {
    test(`${name} → 422 ${error}, balance unchanged`, async ({ request }) => {
      const before = await balance(request);
      const res = await request.post('/api/transfers', { data: data as object });
      expect(res.status()).toBe(422);
      expect(await res.json()).toEqual({ error });
      expect(await balance(request)).toBe(before);
    });
  }

  for (const [name, body] of [['broken JSON', '{ "to": "tunde@kudi.test", "amount": '], ['empty body', '']] as const) {
    test(`${name} → 400 BAD_JSON`, async ({ request }) => {
      const res = await request.post('/api/transfers', { headers: { 'content-type': 'application/json' }, data: Buffer.from(body) });
      expect(res.status()).toBe(400);
      expect(await res.json()).toEqual({ error: 'BAD_JSON' });
    });
  }
});
