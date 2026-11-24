import { expect, test, type APIRequestContext } from '@playwright/test';

type State = 'active' | 'frozen' | 'blocked';
type Action = 'freeze' | 'unfreeze' | 'block';

/**
 * Exercise 04 · State transitions. Cover all 9 cells of the card's state table. See README.md.
 * Each row: [from, action, expected new state, or null if Kudi must refuse]
 */
const table: [from: State, action: Action, to: State | null][] = [
  ['active', 'freeze', 'frozen'],
  // TODO: the other 3 valid moves
  // TODO: the 5 refusals
];

/** Get the card into `state` using only valid moves. */
async function putCardIn(request: APIRequestContext, state: State) {
  if (state === 'active') return;
  // TODO: frozen and blocked
  throw new Error(`putCardIn(${state}) not written yet`);
}

test.beforeEach(async ({ request }) => {
  await request.post('/api/test/reset');
  const login = await request.post('/api/sessions', { data: { email: 'ada@kudi.test', password: 'kudi-ada-pass' } });
  expect(login.status()).toBe(201);
});

for (const [from, action, to] of table) {
  test(`${from} → ${action} → ${to ?? 'refused'}`, async ({ request }) => {
    await putCardIn(request, from);
    const res = await request.post(`/api/card/${action}`);
    expect(res.status()).toBe(to ? 200 : 409);
    const card = await (await request.get('/api/card')).json();
    expect(card.state).toBe(to ?? from);
  });
}
