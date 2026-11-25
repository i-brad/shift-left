import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

/** Seed data, matching SPEC.md → Accounts. */
export const SEED_USERS = [
  { name: 'Ada', email: 'ada@kudi.test', password: 'kudi-ada-pass', balance: 600_000, tier: 'plus' },
  { name: 'Tunde', email: 'tunde@kudi.test', password: 'kudi-tunde-pass', balance: 20_000, tier: 'basic' },
  { name: 'Bola', email: 'bola@kudi.test', password: 'kudi-bola-pass', balance: 50_000, tier: 'basic' },
] as const;

export type User = { id: number; name: string; email: string; balance: number; tier: 'basic' | 'plus' };

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 32).toString('hex')}`;
}

export function checkPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const a = scryptSync(password, salt, 32);
  const b = Buffer.from(hash, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

export type Db = ReturnType<typeof openDb>;

/** Opens (or creates) the database. Use ':memory:' in tests. */
export function openDb(path: string) {
  const db = new DatabaseSync(path);
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      balance INTEGER NOT NULL CHECK (balance >= 0),
      tier TEXT NOT NULL DEFAULT 'basic' CHECK (tier IN ('basic', 'plus'))
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS transfers (
      id INTEGER PRIMARY KEY,
      from_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      to_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      fee INTEGER NOT NULL DEFAULT 0,
      express INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
    CREATE TABLE IF NOT EXISTS cards (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      state TEXT NOT NULL DEFAULT 'active' CHECK (state IN ('active', 'frozen', 'blocked'))
    );
  `);

  const api = {
    reset() {
      db.exec('DELETE FROM cards; DELETE FROM transfers; DELETE FROM sessions; DELETE FROM users;');
      const insert = db.prepare('INSERT INTO users (name, email, password, balance, tier) VALUES (?, ?, ?, ?, ?)');
      for (const u of SEED_USERS) {
        const r = insert.run(u.name, u.email, hashPassword(u.password), u.balance, u.tier);
        db.prepare('INSERT INTO cards (user_id) VALUES (?)').run(Number(r.lastInsertRowid));
      }
    },
    /** Test factory: a new user with a unique email. */
    createUser({ name, balance, tier }: { name: string; balance: number; tier: 'basic' | 'plus' }) {
      const n = (db.prepare('SELECT COUNT(*) AS n FROM users').get() as { n: number }).n + 1;
      const email = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${n}-${randomBytes(3).toString('hex')}@kudi.test`;
      const password = `kudi-${randomBytes(6).toString('hex')}`;
      const r = db.prepare('INSERT INTO users (name, email, password, balance, tier) VALUES (?, ?, ?, ?, ?)').run(name, email, hashPassword(password), balance, tier);
      db.prepare('INSERT INTO cards (user_id) VALUES (?)').run(Number(r.lastInsertRowid));
      return { name, email, password, balance, tier };
    },
    userByEmail(email: string) {
      return db.prepare('SELECT id, name, email, balance, tier, password FROM users WHERE email = ?').get(email) as (User & { password: string }) | undefined;
    },
    userBySession(token: string) {
      return db.prepare('SELECT u.id, u.name, u.email, u.balance, u.tier FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?').get(token) as User | undefined;
    },
    createSession(userId: number) {
      const token = randomBytes(24).toString('hex');
      db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, userId);
      return token;
    },
    deleteSession(token: string) {
      db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    },
    /** Moves money in one transaction: the sender pays amount + fee; returns the sender's new balance. */
    transfer(fromId: number, toId: number, amount: number, fee = 0, express = false) {
      db.exec('BEGIN');
      try {
        db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(amount + fee, fromId);
        db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(amount, toId);
        const r = db.prepare('INSERT INTO transfers (from_id, to_id, amount, fee, express) VALUES (?, ?, ?, ?, ?)').run(fromId, toId, amount, fee, express ? 1 : 0);
        db.exec('COMMIT');
        const balance = (db.prepare('SELECT balance FROM users WHERE id = ?').get(fromId) as { balance: number }).balance;
        return { id: Number(r.lastInsertRowid), balance };
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    },
    cardState(userId: number) {
      return (db.prepare('SELECT state FROM cards WHERE user_id = ?').get(userId) as { state: 'active' | 'frozen' | 'blocked' }).state;
    },
    setCardState(userId: number, state: string) {
      db.prepare('UPDATE cards SET state = ? WHERE user_id = ?').run(state, userId);
    },
    /** One transfer as seen by `viewerId`, plus who took part. */
    transferById(id: number, viewerId: number) {
      return db
        .prepare(
          `SELECT t.id, t.amount, t.created_at AS createdAt, t.from_id AS fromId, t.to_id AS toId,
                  CASE WHEN t.from_id = ? THEN 'out' ELSE 'in' END AS direction,
                  CASE WHEN t.from_id = ? THEN tu.email ELSE fu.email END AS counterparty
           FROM transfers t JOIN users fu ON fu.id = t.from_id JOIN users tu ON tu.id = t.to_id WHERE t.id = ?`,
        )
        .get(viewerId, viewerId, id) as { id: number; amount: number; createdAt: string; fromId: number; toId: number; direction: 'in' | 'out'; counterparty: string } | undefined;
    },
    history(userId: number) {
      return db
        .prepare(
          `SELECT t.id, t.amount, t.created_at AS createdAt,
                  CASE WHEN t.from_id = ? THEN 'out' ELSE 'in' END AS direction,
                  CASE WHEN t.from_id = ? THEN tu.email ELSE fu.email END AS counterparty
           FROM transfers t JOIN users fu ON fu.id = t.from_id JOIN users tu ON tu.id = t.to_id
           WHERE t.from_id = ? OR t.to_id = ? ORDER BY t.id DESC`,
        )
        .all(userId, userId, userId, userId);
    },
  };

  const count = (db.prepare('SELECT COUNT(*) AS n FROM users').get() as { n: number }).n;
  if (count === 0) api.reset();
  return api;
}
