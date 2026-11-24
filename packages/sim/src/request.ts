/**
 * A model of Kudi's HTTP API for Module 3. The learner builds requests; we compute what the spec says
 * the response should be, and what Kudi (with any planted bugs) actually returns.
 */

export type Method = 'GET' | 'POST' | 'DELETE';
export type ApiPath = '/api/me' | '/api/transfers' | '/api/transfers/7' | '/api/transfers/9' | '/api/nope';
export type Auth = 'none' | 'ada' | 'tunde';
export type BodyKind = 'none' | 'valid' | 'missing-amount' | 'string-amount' | 'huge' | 'malformed';
export type ApiBug = 'history-amount-string' | 'transfer-idor' | 'bad-json-500';

export type ApiRequest = { method: Method; path: ApiPath; auth: Auth; body: BodyKind };
export type ApiResponse = { status: number; body: unknown };

export const PATHS: ApiPath[] = ['/api/me', '/api/transfers', '/api/transfers/7', '/api/transfers/9', '/api/nope'];
export const BODIES: { id: BodyKind; label: string; raw: string }[] = [
  { id: 'none', label: 'no body', raw: '' },
  { id: 'valid', label: 'valid', raw: '{ "to": "tunde@kudi.test", "amount": 5000 }' },
  { id: 'missing-amount', label: 'no amount', raw: '{ "to": "tunde@kudi.test" }' },
  { id: 'string-amount', label: 'amount as text', raw: '{ "to": "tunde@kudi.test", "amount": "5000" }' },
  { id: 'huge', label: 'huge amount', raw: '{ "to": "tunde@kudi.test", "amount": 99999999 }' },
  { id: 'malformed', label: 'broken JSON', raw: '{ "to": "tunde@kudi.test", "amount": ' },
];

/** Transfer 7: Ada → Tunde. Transfer 9: Tunde → Bola (Ada is not involved). */
const T7 = { id: 7, direction: 'out', counterparty: 'tunde@kudi.test', amount: 5000, createdAt: '2026-11-20T09:00:00.000Z' };
const T9_FOR_TUNDE = { id: 9, direction: 'out', counterparty: 'bola@kudi.test', amount: 120000, createdAt: '2026-11-21T10:00:00.000Z' };

function respond(req: ApiRequest, bugs: ReadonlySet<ApiBug>): ApiResponse {
  const known = PATHS.slice(0, 4).includes(req.path);
  if (!known) return { status: 404, body: { error: 'NOT_FOUND' } };
  if (req.method === 'DELETE') return { status: 405, body: { error: 'METHOD_NOT_ALLOWED' } };
  if (req.method === 'POST' && req.path !== '/api/transfers') return { status: 405, body: { error: 'METHOD_NOT_ALLOWED' } };
  if (req.auth === 'none') return { status: 401, body: { error: 'UNAUTHENTICATED' } };

  if (req.path === '/api/me' && req.method === 'GET') {
    return { status: 200, body: req.auth === 'ada' ? { name: 'Ada', email: 'ada@kudi.test', balance: 600000, tier: 'plus' } : { name: 'Tunde', email: 'tunde@kudi.test', balance: 20000, tier: 'basic' } };
  }
  if (req.path === '/api/transfers' && req.method === 'GET') {
    const list = req.auth === 'ada' ? [T7] : [{ ...T7, direction: 'in', counterparty: 'ada@kudi.test' }, T9_FOR_TUNDE];
    return { status: 200, body: bugs.has('history-amount-string') ? list.map((t) => ({ ...t, amount: String(t.amount) })) : list };
  }
  if (req.path === '/api/transfers' && req.method === 'POST') {
    switch (req.body) {
      case 'none':
      case 'malformed':
        return bugs.has('bad-json-500') ? { status: 500, body: { error: 'Internal Server Error' } } : { status: 400, body: { error: 'BAD_JSON' } };
      case 'missing-amount':
      case 'string-amount':
        return { status: 422, body: { error: 'AMOUNT_INVALID' } };
      case 'huge':
        return { status: 422, body: { error: 'AMOUNT_ABOVE_LIMIT' } };
      case 'valid':
        return { status: 201, body: { id: 12, to: 'tunde@kudi.test', amount: 5000, fee: req.auth === 'ada' ? 0 : 10, express: false, balance: req.auth === 'ada' ? 595000 : 14990 } };
    }
  }
  // GET /api/transfers/:id — only the sender or recipient may see it; others get 404 (don't reveal it exists).
  const id = req.path.endsWith('/7') ? 7 : 9;
  const involved = id === 7 || req.auth === 'tunde';
  if (involved) return { status: 200, body: id === 7 ? (req.auth === 'ada' ? T7 : { ...T7, direction: 'in', counterparty: 'ada@kudi.test' }) : T9_FOR_TUNDE };
  return bugs.has('transfer-idor') ? { status: 200, body: { ...T9_FOR_TUNDE, counterparty: 'bola@kudi.test', owner: 'tunde@kudi.test' } } : { status: 404, body: { error: 'NOT_FOUND' } };
}

export function exchange(req: ApiRequest, bugs: ReadonlySet<ApiBug>) {
  const expected = respond(req, new Set());
  const actual = respond(req, bugs);
  return { req, expected, actual, matches: JSON.stringify(expected) === JSON.stringify(actual) };
}
export type Exchange = ReturnType<typeof exchange>;

/** What kind of difference a response has from the spec, if any. */
export function bugShown(x: Exchange): ApiBug | null {
  if (x.matches) return null;
  if (x.actual.status === 500) return 'bad-json-500';
  if (x.req.path === '/api/transfers/9' && x.actual.status === 200) return 'transfer-idor';
  if (x.req.path === '/api/transfers' && x.req.method === 'GET') return 'history-amount-string';
  return null;
}

export type Assertion = 'status' | 'shape' | 'values';
export const ASSERTIONS: { id: Assertion; label: string }[] = [
  { id: 'status', label: 'Status code is as expected' },
  { id: 'shape', label: 'Every field has the expected type' },
  { id: 'values', label: 'Values match the spec exactly' },
];

const typeOf = (v: unknown): string => (Array.isArray(v) ? `[${v.map(typeOf).join(',')}]` : v && typeof v === 'object' ? `{${Object.entries(v as object).map(([k, x]) => `${k}:${typeOf(x)}`).join(',')}}` : typeof v);

/** Which assertions would fail against this exchange (i.e. would catch the difference). */
export function failingAssertions(x: Exchange): Assertion[] {
  const out: Assertion[] = [];
  if (x.actual.status !== x.expected.status) out.push('status');
  if (typeOf(x.actual.body) !== typeOf(x.expected.body)) out.push('shape');
  if (JSON.stringify(x.actual.body) !== JSON.stringify(x.expected.body)) out.push('values');
  return out;
}
