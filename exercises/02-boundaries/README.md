# 02 · Boundaries: test the transfer limits

**Lesson:** Partitions and boundaries · **CTFL:** FL-4.2.1, FL-4.2.2 · **Time:** about 20 minutes

Kudi has a bug in its transfer limits. You don't know where. Find it with tests, not by reading the code.

## Your oracle

Read [`apps/kudi/SPEC.md`](../../apps/kudi/SPEC.md) → *Sending money*. That table is the truth. Kudi is what you're checking.

## Your task

Open [`boundaries.spec.ts`](./boundaries.spec.ts). It already logs in as Ada and has one happy-path test.

1. Run it with the bug on:

   ```bash
   pnpm exercise 02-boundaries
   ```

   It's green. That's the problem: a green suite that misses a bug.

2. Add cases to the `cases` table until the run goes **red**. Use what you learned:
   - one value from each partition (too small, valid, too big)
   - both sides of each edge
3. When something fails, read the failure. Is it the product, your test, the environment or the data?
4. Prove your test catches the bug, not just *a* bug. Run with the bug off:

   ```bash
   pnpm exercise 02-boundaries --fixed
   ```

   Everything should be green now.

## Done when

- With the bug **on**, exactly one case fails, and its name tells you what's wrong.
- With the bug **off**, all cases pass.
- Each case checks the error code from the spec, not just "it failed".

Stuck? [`HINTS.md`](./HINTS.md) has three hints, each one giving away a bit more. The reference answer is in `solution/` (`pnpm exercise 02-boundaries --solution`), but try first.

## Stretch

- Add the partitions from the lesson's deep dive: `0`, `-500`, `100.5`, `"5000"` as a string. What does the spec say for each?
- Write the same cases as a **unit** test against `validateAmount` in `apps/kudi/src/domain/transfer.ts`. How much faster is it?
