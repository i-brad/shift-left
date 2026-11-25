# 07 · Web automation

**Lessons:** Locators that last · Waiting, not sleeping · Fixtures and isolation · Debugging with traces · **Time:** about 45 minutes

`pnpm exercise 07-web` starts Kudi's API **and** web app with three switches on:

- `KUDI_REDESIGN=1`: the redesigned Send form (new markup, same labels and roles)
- `KUDI_LATENCY=1200`: every API call takes 1.2 s
- `KUDI_BUGS=balance-stale`: one real bug

`--fixed` turns all three off.

## Your task

1. Run it. Everything is red, mostly for the wrong reasons.
2. **Locators:** replace ids, XPath and exact text with `getByLabel`, `getByRole` and `getByTestId`.
3. **Waits:** delete every `waitForTimeout`. Assert with `await expect(locator)…`.
4. **Fixtures:** move login into a fixture (`test.extend`) that resets data and gives the test a logged-in page.
5. Run again. When exactly one test is red, open its trace: `pnpm --filter exercises exec playwright show-trace test-results/<folder>/trace.zip`. Find the first wrong frame and decide which layer the bug is in.
6. `pnpm exercise 07-web --fixed`: all green.

## Done when

- With the switches on, only the balance test fails, and you can say which API call is wrong.
- With `--fixed`, everything passes.
- No `waitForTimeout`, no XPath, no ids in the file.

Stuck? [`HINTS.md`](./HINTS.md). Reference: `pnpm exercise 07-web --solution`.
