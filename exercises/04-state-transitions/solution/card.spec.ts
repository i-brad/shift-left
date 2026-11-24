import { expect, test, type APIRequestContext } from '@playwright/test';

type State = 'active' | 'frozen' | 'blocked';
type Action = 'freeze' | 'unfreeze' | 'block';

/**
 * Reference solution for exercise 04: all 9 cells. With the bug on, only blocked → unfreeze fails.
 * Each row: [from, action, expected new state, or null if Kudi must refuse]
 */
const table: [from: State, action: Action, to: State | null][] = [
  ['active', 'freeze', 'frozen'],
  ['active', 'unfreeze', null],
  ['active', 'block', 'blocked'],
  ['frozen', 'freeze', null],
  ['frozen', 'unfreeze', 'active'],
  ['frozen', 'block', 'blocked'],
  ['blocked', 'freeze', null],
  ['blocked', 'unfreeze', null],
  ['blocked', 'block', null],
];

/** Get the card into `state` using only valid moves. */
async function putCardIn(request: APIRequestContext, state: State) {
  if (state === 'active') return;
  const res = await request.post(`/api/card/${state === 'frozen' ? 'freeze' : 'block'}`);
  expect(res.status()).toBe(200);
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
