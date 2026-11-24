# 03 · Decision tables: test the transfer fees

**Lesson:** Decision tables · **CTFL:** FL-4.2.3 · **Time:** about 20 minutes

Kudi's fee depends on three conditions at once. One combination is charged wrong. Find it with a decision table.

## Your oracle

[`apps/kudi/SPEC.md`](../../apps/kudi/SPEC.md) → *Fees*. Ada is a **Plus** customer, Tunde is **Basic**. `GET /api/fees?amount=…&express=…` returns the fee for whoever is logged in, without moving money.

## Your task

1. Run the starter with the bug on: `pnpm exercise 03-decision-tables`. One row, green.
2. On paper (or in a comment), write the full table: tier × amount (≤ ₦5,000 / > ₦5,000) × express. How many columns?
3. Add one row to `table` per column. Run again until it goes **red**.
4. Look at **which** rows fail. What do they have in common?
5. Bonus: collapse the table to one row per spec rule (R1–R5). Does it still catch the bug?
6. `pnpm exercise 03-decision-tables --fixed`: everything green.

## Done when

- With the bug on, the failing rows are exactly the ones the spec and the code disagree on.
- With the bug off, every row passes.
- Someone could check your `table` against SPEC.md line by line.

Stuck? [`HINTS.md`](./HINTS.md). Reference: `pnpm exercise 03-decision-tables --solution`.
