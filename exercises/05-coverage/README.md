# 05 · Coverage: reach 100% branch coverage on cashback()

**Lesson:** Statement and branch coverage · **CTFL:** FL-4.3 · **Time:** about 15 minutes

`apps/kudi/src/domain/cashback.ts` has one test. Coverage says every **line** ran. Not every **branch** did, and a bug lives on the path nobody took.

## Your oracle

[`apps/kudi/SPEC.md`](../../apps/kudi/SPEC.md) → *Cashback*.

## Your task

1. `pnpm exercise 05-coverage`. The test passes, but the run fails: branch coverage is under the 100% threshold. Read the coverage table.
2. Open `05-coverage/coverage/index.html` in a browser. Which branch is never taken?
3. Add cases to `cases` in `cashback.test.ts` until branch coverage is 100%. With the bug on, one of your new cases should fail. Why?
4. `pnpm exercise 05-coverage --fixed`: all cases pass, coverage 100%.

## Done when

- Branch coverage is 100%.
- Every case's expected value comes from SPEC.md, not from running the code.
- With the bug on, the failing case is a Basic customer.

Stuck? [`HINTS.md`](./HINTS.md). Reference: `pnpm exercise 05-coverage --solution`.
