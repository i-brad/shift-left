import { Hono, type Context } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { noBugs, type Bugs } from '../bugs';
import { validateAmount, type TransferError } from '../domain/transfer';
import { checkPassword, type Db, type User } from './db';

const COOKIE = 'kudi_session';

export function createApp({ db, bugs = noBugs, testRoutes = true }: { db: Db; bugs?: Bugs; testRoutes?: boolean }) {
  const app = new Hono<{ Variables: { user: User } }>().basePath('/api');

  const readJson = async (c: Context) => {
    try {
      return (await c.req.json()) as Record<string, unknown>;
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
    setCookie(c, COOKIE, db.createSession(user.id), { httpOnly: true, sameSite: 'Lax', path: '/' });
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
    const { name, email, balance } = c.get('user');
    return c.json({ name, email, balance });
  });

  app.get('/transfers', (c) => c.json(db.history(c.get('user').id)));

  app.post('/transfers', async (c) => {
    const me = c.get('user');
    const body = await readJson(c);
    if (!body) return c.json({ error: 'BAD_JSON' }, 400);

    const amount = validateAmount(body.amount, bugs);
    if (!amount.ok) return fail(c, amount.error);
    if (amount.amount > me.balance) return fail(c, 'INSUFFICIENT_FUNDS');

    const to = typeof body.to === 'string' ? db.userByEmail(body.to.trim().toLowerCase()) : undefined;
    if (!to) return fail(c, 'RECIPIENT_NOT_FOUND');
    if (to.id === me.id) return fail(c, 'SAME_ACCOUNT');

    const { id, balance } = db.transfer(me.id, to.id, amount.amount);
    return c.json({ id, to: to.email, amount: amount.amount, balance }, 201);
  });

  return app;
}
