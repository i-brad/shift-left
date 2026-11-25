import { beforeEach, describe, expect, it } from 'vitest';
import { bugsFrom, noBugs, type Bugs } from '../bugs';
import { createApp } from './app';
import { openDb } from './db';

/** API tests against an in-memory database: fast, isolated, no server needed. */
function setup(bugs: Bugs = noBugs) {
  const app = createApp({ db: openDb(':memory:'), bugs });
  let cookie = '';
  const call = async (method: string, path: string, body?: unknown) => {
    const res = await app.request(`/api${path}`, {
      method,
      headers: { 'content-type': 'application/json', cookie },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const set = res.headers.get('set-cookie');
    if (set) cookie = set.split(';')[0] ?? '';
    const text = await res.text();
    return { status: res.status, json: text ? JSON.parse(text) : null };
  };
  const loginAsAda = () => call('POST', '/sessions', { email: 'ada@kudi.test', password: 'kudi-ada-pass' });
  return { call, loginAsAda };
}

describe('sessions', () => {
  it('logs in with the seed account', async () => {
    const { loginAsAda } = setup();
    expect((await loginAsAda()).status).toBe(201);
  });

  it.each([
    ['wrong password', { email: 'ada@kudi.test', password: 'nope' }],
    ['unknown email', { email: 'who@kudi.test', password: 'kudi-ada-pass' }],
  ])('gives the same error for %s', async (_, creds) => {
    const { call } = setup();
    expect(await call('POST', '/sessions', creds)).toEqual({ status: 401, json: { error: 'INVALID_CREDENTIALS' } });
  });

  it('requires a session for /me', async () => {
    const { call } = setup();
    expect((await call('GET', '/me')).status).toBe(401);
  });
});

describe('POST /transfers', () => {
  let api: ReturnType<typeof setup>;
  beforeEach(async () => {
    api = setup();
    await api.loginAsAda();
  });

  it('moves money between accounts', async () => {
    const res = await api.call('POST', '/transfers', { to: 'tunde@kudi.test', amount: 5000 });
    expect(res).toMatchObject({ status: 201, json: { amount: 5000, balance: 595_000 } });
    expect((await api.call('GET', '/me')).json.balance).toBe(595_000);
  });

  it.each([
    [99, 'AMOUNT_BELOW_MIN'],
    [500_001, 'AMOUNT_ABOVE_LIMIT'],
    [100.5, 'AMOUNT_INVALID'],
  ])('rejects ₦%s with %s', async (amount, error) => {
    expect(await api.call('POST', '/transfers', { to: 'tunde@kudi.test', amount })).toEqual({ status: 422, json: { error } });
  });

  it('accepts exactly the maximum', async () => {
    expect((await api.call('POST', '/transfers', { to: 'tunde@kudi.test', amount: 500_000 })).status).toBe(201);
  });

  it('checks balance, recipient and self-transfer', async () => {
    await api.call('POST', '/transfers', { to: 'tunde@kudi.test', amount: 500_000 });
    expect((await api.call('POST', '/transfers', { to: 'tunde@kudi.test', amount: 100_001 })).json.error).toBe('INSUFFICIENT_FUNDS');
    expect((await api.call('POST', '/transfers', { to: 'nobody@kudi.test', amount: 100 })).json.error).toBe('RECIPIENT_NOT_FOUND');
    expect((await api.call('POST', '/transfers', { to: 'ada@kudi.test', amount: 100 })).json.error).toBe('SAME_ACCOUNT');
  });

  it('lists history newest first', async () => {
    await api.call('POST', '/transfers', { to: 'tunde@kudi.test', amount: 100 });
    await api.call('POST', '/transfers', { to: 'tunde@kudi.test', amount: 200 });
    const { json } = await api.call('GET', '/transfers');
    expect(json.map((t: { amount: number }) => t.amount)).toEqual([200, 100]);
    expect(json[0]).toMatchObject({ direction: 'out', counterparty: 'tunde@kudi.test' });
  });
});

describe('with the limit-exclusive bug on', () => {
  it('rejects exactly ₦500,000', async () => {
    const api = setup(bugsFrom(['limit-exclusive']));
    await api.loginAsAda();
    expect(await api.call('POST', '/transfers', { to: 'tunde@kudi.test', amount: 500_000 })).toEqual({ status: 422, json: { error: 'AMOUNT_ABOVE_LIMIT' } });
  });
});

describe('fees', () => {
  const asTunde = async () => {
    const api = setup();
    await api.call('POST', '/sessions', { email: 'tunde@kudi.test', password: 'kudi-tunde-pass' });
    return api;
  };

  it('previews fees by tier (Ada is Plus, Tunde is Basic)', async () => {
    const ada = setup();
    await ada.loginAsAda();
    expect((await ada.call('GET', '/fees?amount=2000&express=true')).json).toEqual({ fee: 50 });
    const tunde = await asTunde();
    expect((await tunde.call('GET', '/fees?amount=8000&express=false')).json).toEqual({ fee: 25 });
  });

  it('charges the fee on top of the amount', async () => {
    const tunde = await asTunde();
    const res = await tunde.call('POST', '/transfers', { to: 'ada@kudi.test', amount: 1000, express: true });
    expect(res.json).toMatchObject({ fee: 100, express: true, balance: 18_900 });
  });

  it('counts the fee when checking the balance', async () => {
    const tunde = await asTunde();
    expect((await tunde.call('POST', '/transfers', { to: 'ada@kudi.test', amount: 19_995 })).json.error).toBe('INSUFFICIENT_FUNDS');
  });

  it('with fee-express-first, Plus express costs ₦100', async () => {
    const api = setup(bugsFrom(['fee-express-first']));
    await api.loginAsAda();
    expect((await api.call('GET', '/fees?amount=2000&express=true')).json).toEqual({ fee: 100 });
  });
});

describe('card', () => {
  it('moves through valid states and refuses invalid ones without changing state', async () => {
    const api = setup();
    await api.loginAsAda();
    expect((await api.call('GET', '/card')).json).toEqual({ state: 'active' });
    expect(await api.call('POST', '/card/unfreeze')).toEqual({ status: 409, json: { error: 'INVALID_TRANSITION', state: 'active' } });
    expect((await api.call('POST', '/card/freeze')).json).toEqual({ state: 'frozen' });
    expect((await api.call('POST', '/card/block')).json).toEqual({ state: 'blocked' });
    expect((await api.call('POST', '/card/unfreeze')).status).toBe(409);
    expect((await api.call('GET', '/card')).json).toEqual({ state: 'blocked' });
  });

  it('404s on an unknown action', async () => {
    const api = setup();
    await api.loginAsAda();
    expect((await api.call('POST', '/card/explode')).status).toBe(404);
  });

  it('with card-unblock, a blocked card can be unfrozen', async () => {
    const api = setup(bugsFrom(['card-unblock']));
    await api.loginAsAda();
    await api.call('POST', '/card/block');
    expect((await api.call('POST', '/card/unfreeze')).json).toEqual({ state: 'active' });
  });
});

describe('Module 3 API rules', () => {
  const as = (s: ReturnType<typeof setup>, who: 'ada' | 'tunde' | 'bola') => s.call('POST', '/sessions', { email: `${who}@kudi.test`, password: `kudi-${who}-pass` });
  const tundePaysBola = async (bugs: Bugs = noBugs) => {
    const s = setup(bugs);
    await as(s, 'tunde');
    const { json } = await s.call('POST', '/transfers', { to: 'bola@kudi.test', amount: 1000 });
    return { s, id: json.id as number };
  };

  it('history amounts are numbers', async () => {
    const s = setup();
    await s.loginAsAda();
    await s.call('POST', '/transfers', { to: 'tunde@kudi.test', amount: 5000 });
    const { json } = await s.call('GET', '/transfers');
    expect(typeof json[0].amount).toBe('number');
  });

  it('with history-amount-string, amounts are strings', async () => {
    const s = setup(bugsFrom(['history-amount-string']));
    await s.loginAsAda();
    await s.call('POST', '/transfers', { to: 'tunde@kudi.test', amount: 5000 });
    expect((await s.call('GET', '/transfers')).json[0].amount).toBe('5000');
  });

  it('a transfer is visible to the sender and recipient only', async () => {
    const { s, id } = await tundePaysBola();
    expect((await s.call('GET', `/transfers/${id}`)).json).toMatchObject({ id, direction: 'out', counterparty: 'bola@kudi.test', amount: 1000 });
    await as(s, 'bola');
    expect((await s.call('GET', `/transfers/${id}`)).json).toMatchObject({ direction: 'in', counterparty: 'tunde@kudi.test' });
    await as(s, 'ada');
    expect(await s.call('GET', `/transfers/${id}`)).toEqual({ status: 404, json: { error: 'NOT_FOUND' } });
    expect((await s.call('GET', '/transfers/9999')).status).toBe(404);
  });

  it('with transfer-idor, Ada can read it', async () => {
    const { s, id } = await tundePaysBola(bugsFrom(['transfer-idor']));
    await as(s, 'ada');
    expect((await s.call('GET', `/transfers/${id}`)).status).toBe(200);
  });

  const raw = async (bugs: Bugs) => {
    const app = createApp({ db: openDb(':memory:'), bugs });
    const login = await app.request('/api/sessions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'ada@kudi.test', password: 'kudi-ada-pass' }) });
    const cookie = (login.headers.get('set-cookie') ?? '').split(';')[0]!;
    return app.request('/api/transfers', { method: 'POST', headers: { 'content-type': 'application/json', cookie }, body: '{ "to": "tunde@kudi.test", "amount": ' });
  };

  it('broken JSON is a 400', async () => {
    const res = await raw(noBugs);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'BAD_JSON' });
  });

  it('with bad-json-500, broken JSON is a 500', async () => {
    expect((await raw(bugsFrom(['bad-json-500']))).status).toBe(500);
  });
});

describe('Module 4 switches', () => {
  it('balance-stale: /me keeps the login balance after a transfer', async () => {
    const s = setup(bugsFrom(['balance-stale']));
    await s.loginAsAda();
    const sent = await s.call('POST', '/transfers', { to: 'tunde@kudi.test', amount: 5000 });
    expect(sent.json.balance).toBe(595_000);
    expect((await s.call('GET', '/me')).json.balance).toBe(600_000);
  });

  it('latency delays responses but not test routes', async () => {
    const app = createApp({ db: openDb(':memory:'), latencyMs: 600 });
    let t = Date.now();
    await app.request('/api/test/reset', { method: 'POST' });
    expect(Date.now() - t).toBeLessThan(500);
    t = Date.now();
    await app.request('/api/me');
    expect(Date.now() - t).toBeGreaterThanOrEqual(590);
  });
});

describe('Module 5 factory', () => {
  const make = async (s: ReturnType<typeof setup>, data: object) => (await s.call('POST', '/test/users', data)).json as { email: string; password: string };
  it('creates unique users with chosen balance and tier', async () => {
    const s = setup();
    const a = await make(s, { name: 'Zero', balance: 0 });
    const b = await make(s, { name: 'Zero', balance: 0 });
    expect(a.email).not.toBe(b.email);
    await s.call('POST', '/sessions', { email: a.email, password: a.password });
    expect((await s.call('GET', '/me')).json).toMatchObject({ name: 'Zero', balance: 0, tier: 'basic' });
  });

  it('₦0 account: 422 INSUFFICIENT_FUNDS; 500 with empty-account-500', async () => {
    for (const [bugs, status] of [[noBugs, 422], [bugsFrom(['empty-account-500']), 500]] as const) {
      const s = setup(bugs);
      const u = await make(s, { balance: 0 });
      await s.call('POST', '/sessions', { email: u.email, password: u.password });
      const res = await s.call('POST', '/transfers', { to: 'tunde@kudi.test', amount: 100 }).catch(() => ({ status: 500 }));
      expect(res.status).toBe(status);
    }
  });
});
