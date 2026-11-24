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
