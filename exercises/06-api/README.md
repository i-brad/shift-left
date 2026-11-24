# 06 · API testing

**Lessons:** HTTP for testers · Asserting on responses · Authentication vs authorisation · Negative tests · **Time:** about 40 minutes

Three bugs are switched on in Kudi's API. The starter tests pass anyway, because they only check the status code, only test as the owner, and only send well-formed JSON.

## Your oracle

[`apps/kudi/SPEC.md`](../../apps/kudi/SPEC.md) → *Sending money* (the error table) and *History* (`GET /api/transfers` and `GET /api/transfers/:id`). Test accounts: Ada, Tunde and Bola.

## Your task

1. `pnpm exercise 06-api`. Green, with three bugs on.
2. **Asserting:** give the history test a shape check (every field, every type) and the values for this transfer.
3. **Authorisation:** Tunde sends Bola money. Log in as Ada and ask for that transfer.
4. **Negatives:** a test per row of the error table you can reach, plus broken JSON and an empty body. After each refusal, check the balance didn't change.
5. Run until each section has a red test, then `pnpm exercise 06-api --fixed` until all green.

## Done when

- With the bugs on, every section has at least one red test (one bug per section), and each test's name says what it checks.
- With `--fixed`, everything passes.

Stuck? [`HINTS.md`](./HINTS.md). Reference: `pnpm exercise 06-api --solution`.
