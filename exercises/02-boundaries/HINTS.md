# Hints

<details>
<summary>Hint 1: where to look</summary>

The spec has two edges for the amount: the minimum and the maximum. Bugs live on edges, because that's where the code compares numbers.

</details>

<details>
<summary>Hint 2: which values</summary>

For each edge, pick the value **on** the edge and the first value **past** it. For ₦100 that's 99 and 100. What is it for the maximum?

</details>

<details>
<summary>Hint 3: almost the answer</summary>

Add these rows to `cases`:

```ts
[99, 422, 'AMOUNT_BELOW_MIN'],
[100, 201, null],
[500_000, 201, null],
[500_001, 422, 'AMOUNT_ABOVE_LIMIT'],
```

Run with the bug on. Which one fails? Read SPEC.md again: is ₦500,000 allowed?

</details>
