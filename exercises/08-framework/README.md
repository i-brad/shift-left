# 08 · Framework

**Lessons:** Structure that scales · Test data strategy · Flaky tests · **Time:** about 45 minutes

This exercise runs **fully parallel on 4 workers** against Kudi's web app. The starter tests reset the shared database and all use seed Ada, so they trample each other. They also each copy the same locators.

Kudi has a test-only factory: `POST /api/test/users { name?, balance?, tier? }` returns a new user with a unique email and its password (see SPEC.md).

## Your task

1. `pnpm exercise 08-framework --fixed`. Red, with no bug on: the tests collide.
2. Create `pages/LoginPage.ts` and `pages/SendPage.ts`. Locators and actions only.
3. Create `fixtures.ts`: a `createUser` factory and fixtures `user` and `sendPage` (logged in). Delete the reset.
4. Rewrite the tests to use them. Each test creates its own users. Recalculate the expected balances (Basic pays a ₦10 fee).
5. Add the missing test: a user with ₦0 tries to send ₦100.
6. `--fixed` green, then `pnpm exercise 08-framework`: exactly one red.

## Done when

- Green on 4 workers with `--fixed`, every time (try `-- --repeat-each=3`).
- No locator appears outside `pages/`.
- With the bug on, only the ₦0 test fails.

Stuck? [`HINTS.md`](./HINTS.md). Reference: `pnpm exercise 08-framework --solution`.
