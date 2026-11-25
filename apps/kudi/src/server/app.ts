import { Hono, type Context } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { noBugs, type Bugs } from '../bugs';
import { CARD_ACTIONS, nextCardState, type CardAction } from '../domain/card';
import { cashback } from '../domain/cashback';
import { calculateFee } from '../domain/fees';
import { validateAmount, type TransferError } from '../domain/transfer';
import { checkPassword, type Db, type User } from './db';

const COOKIE = 'kudi_session';

export function createApp({ db, bugs = noBugs, testRoutes = true, latencyMs = 0 }: { db: Db; bugs?: Bugs; testRoutes?: boolean; latencyMs?: number }) {
  const app = new Hono<{ Variables: { user: User } }>().basePath('/api');
  /** Balance at login, per session: only used by the balance-stale bug. */
  const balanceAtLogin = new Map<string, number>();

  // KUDI_LATENCY: a slow network, for practising waits. Test routes stay fast.
  if (latencyMs > 0)
    app.use('*', async (c, next) => {
      if (!c.req.path.startsWith('/api/test/')) await new Promise((r) => setTimeout(r, latencyMs));
      await next();
    });

  const readJson = async (c: Context) => {
    try {
      const body: unknown = await c.req.json();
      return body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  };

  const fail = (c: Context, error: TransferError) => c.json({ error }, 422);

  app.post('/sessions', async (c) => {
    const body = await readJson(c);
    const user = typeof body?.email === 'string' ? db.userByEmail(body.email) : undefined;
    if (!user || typeof body?.password !== 'string' || !checkPassword(body.password, user.password)) {
      return c.json({ error: 'INVALID_CREDENTIALS' }, 401);
    }
    const token = db.createSession(user.id);
    balanceAtLogin.set(token, user.balance);
    setCookie(c, COOKIE, token, { httpOnly: true, sameSite: 'Lax', path: '/' });
    return c.json({ name: user.name, email: user.email }, 201);
  });

  app.delete('/sessions', (c) => {
    const token = getCookie(c, COOKIE);
    if (token) db.deleteSession(token);
    deleteCookie(c, COOKIE, { path: '/' });
    return c.body(null, 204);
  });

  app.get('/bugs', (c) => c.json({ active: bugs.list }));

  if (testRoutes) {
    /** Restores the seed accounts. For test isolation only; never exposed in production. */
    app.post('/test/reset', (c) => {
      db.reset();
      return c.body(null, 204);
    });

    /** Factory: POST /api/test/users { name?, balance?, tier? } → a fresh user and its password. */
    app.post('/test/users', async (c) => {
      const body = (await readJson(c)) ?? {};
      const balance = Number.isInteger(body.balance) && (body.balance as number) >= 0 ? (body.balance as number) : 100_000;
      const tier = body.tier === 'plus' ? 'plus' : 'basic';
      const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim().slice(0, 40) : 'Test user';
      return c.json(db.createUser({ name, balance, tier }), 201);
    });
  }

  // Everything below needs a session.
  app.use('*', async (c, next) => {
    const token = getCookie(c, COOKIE);
    const user = token ? db.userBySession(token) : undefined;
    if (!user) return c.json({ error: 'UNAUTHENTICATED' }, 401);
    c.set('user', user);
    await next();
  });

  app.get('/me', (c) => {
    const { name, email, balance, tier } = c.get('user');
    const stale = bugs.on('balance-stale') ? balanceAtLogin.get(getCookie(c, COOKIE) ?? '') : undefined;
    return c.json({ name, email, balance: stale ?? balance, tier });
  });

  app.get('/transfers', (c) => {
    const rows = db.history(c.get('user').id) as { amount: number }[];
    return c.json(bugs.on('history-amount-string') ? rows.map((r) => ({ ...r, amount: String(r.amount) })) : rows);
  });

  app.get('/transfers/:id', (c) => {
    const me = c.get('user');
    const t = db.transferById(Number(c.req.param('id')), me.id);
    // Only the sender and the recipient may see a transfer. Everyone else gets 404, so ids don't leak.
    const allowed = t && (bugs.on('transfer-idor') || t.fromId === me.id || t.toId === me.id);
    if (!t || !allowed) return c.json({ error: 'NOT_FOUND' }, 404);
    const { fromId: _f, toId: _t, ...view } = t;
    return c.json(view);
  });

  app.get('/fees', (c) => {
    const amount = Number(c.req.query('amount'));
    const express = c.req.query('express') === 'true';
    const check = validateAmount(amount, bugs);
    if (!check.ok) return fail(c, check.error);
    return c.json({ fee: calculateFee(c.get('user').tier, check.amount, express, bugs) });
  });

  app.get('/cashback', (c) => {
    const amount = Number(c.req.query('amount'));
    const check = validateAmount(amount, bugs);
    if (!check.ok) return fail(c, check.error);
    const value = cashback(c.get('user').tier, check.amount, bugs);
    return c.json({ cashback: Number.isNaN(value) ? null : value });
  });

  app.get('/card', (c) => c.json({ state: db.cardState(c.get('user').id) }));

  app.post('/card/:action', (c) => {
    const action = c.req.param('action') as CardAction;
    if (!CARD_ACTIONS.includes(action)) return c.json({ error: 'UNKNOWN_ACTION' }, 404);
    const me = c.get('user');
    const from = db.cardState(me.id);
    const to = nextCardState(from, action, bugs);
    if (!to) return c.json({ error: 'INVALID_TRANSITION', state: from }, 409);
    db.setCardState(me.id, to);
    return c.json({ state: to });
  });

  app.post('/transfers', async (c) => {
    const me = c.get('user');
    const body = await readJson(c);
    if (!body) {
      if (bugs.on('bad-json-500')) throw new Error('Unexpected end of JSON input');
      return c.json({ error: 'BAD_JSON' }, 400);
    }

    const amount = validateAmount(body.amount, bugs);
    if (!amount.ok) return fail(c, amount.error);
    const express = body.express === true;
    const fee = calculateFee(me.tier, amount.amount, express, bugs);
    if (me.balance === 0 && bugs.on('empty-account-500')) throw new Error('Cannot read properties of undefined (reading "limit")');
    if (amount.amount + fee > me.balance) return fail(c, 'INSUFFICIENT_FUNDS');

    const to = typeof body.to === 'string' ? db.userByEmail(body.to.trim().toLowerCase()) : undefined;
    if (!to) return fail(c, 'RECIPIENT_NOT_FOUND');
    if (to.id === me.id) return fail(c, 'SAME_ACCOUNT');

    const { id, balance } = db.transfer(me.id, to.id, amount.amount, fee, express);
    return c.json({ id, to: to.email, amount: amount.amount, fee, express, balance }, 201);
  });

  return app;
}
