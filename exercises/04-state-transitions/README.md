# 04 · State transitions: test the card

**Lesson:** State transitions · **CTFL:** FL-4.2.4 · **Time:** about 25 minutes

Kudi's card has three states. Every allowed move works. One move that should be impossible isn't. Find it.

## Your oracle

[`apps/kudi/SPEC.md`](../../apps/kudi/SPEC.md) → *Card*: the state table and what a refusal must look like (`409`, state unchanged).

## Your task

1. Run the starter with the bug on: `pnpm exercise 04-state-transitions`. Green.
2. Finish `putCardIn(request, state)`: get the card into a state **using only valid moves** through the API.
3. Add rows to `table` until it covers all 9 state × action pairs.
4. For refusals, check the status **and** that the card stayed where it was.
5. Run until red, then `pnpm exercise 04-state-transitions --fixed` until green.

## Done when

- All 9 cells are in `table`.
- With the bug on, exactly one row fails, and its name says which move.
- Refusal rows check both the `409` and the unchanged state.

Stuck? [`HINTS.md`](./HINTS.md). Reference: `pnpm exercise 04-state-transitions --solution`.
