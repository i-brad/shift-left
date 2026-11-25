import { test as base, type APIRequestContext } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { SendPage } from './pages/SendPage';

export type NewUser = { name?: string; balance?: number; tier?: 'basic' | 'plus' };
export type User = { name: string; email: string; password: string; balance: number; tier: 'basic' | 'plus' };

/** Factory: a fresh user with a unique email, via Kudi's test-only endpoint. */
export async function createUser(request: APIRequestContext, overrides: NewUser = {}): Promise<User> {
  const res = await request.post('/api/test/users', { data: { name: 'Test user', balance: 100_000, tier: 'basic', ...overrides } });
  if (res.status() !== 201) throw new Error(`createUser failed: ${res.status()}`);
  return res.json();
}

type Fixtures = {
  /** Override per file or test with test.use({ userData: { balance: 0 } }). */
  userData: NewUser;
  user: User;
  /** A Send page, already logged in as `user`. */
  sendPage: SendPage;
};

export const test = base.extend<Fixtures>({
  userData: [{}, { option: true }],
  user: async ({ request, userData }, use) => use(await createUser(request, userData)),
  sendPage: async ({ page, user }, use) => {
    await new LoginPage(page).logIn(user.email, user.password);
    await use(new SendPage(page));
  },
});
export { expect } from '@playwright/test';
