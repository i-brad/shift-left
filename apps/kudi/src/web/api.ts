export type Me = { name: string; email: string; balance: number };
export type Transfer = { id: number; direction: 'out' | 'in'; counterparty: string; amount: number; createdAt: string };
export type ApiError = { status: number; error: string };

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'same-origin',
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) throw { status: res.status, error: json?.error ?? 'UNKNOWN' } satisfies ApiError;
  return json as T;
}

export const api = {
  login: (email: string, password: string) => call<{ name: string }>('POST', '/sessions', { email, password }),
  logout: () => call<null>('DELETE', '/sessions'),
  me: () => call<Me>('GET', '/me'),
  history: () => call<Transfer[]>('GET', '/transfers'),
  send: (to: string, amount: number) => call<{ id: number; balance: number }>('POST', '/transfers', { to, amount }),
};

export type Api = typeof api;
