# Kudi spec

Kudi is a made-up fintech app that exists to be tested. This file is the **test oracle**: when Kudi and this spec disagree, Kudi is wrong (or the spec is unclear — that's a finding too).

## Accounts

| Name | Email | Password | Tier | Starting balance |
| --- | --- | --- | --- | --- |
| Ada | ada@kudi.test | kudi-ada-pass | Plus | ₦600,000 |
| Tunde | tunde@kudi.test | kudi-tunde-pass | Basic | ₦20,000 |

Every account starts with an **active** card.

These are test accounts in a local database. `POST /api/test/reset` restores them.

## Logging in

- `POST /api/sessions` with `{ "email", "password" }`.
- Correct details → `201` and a `kudi_session` cookie.
- Wrong email **or** wrong password → `401 { "error": "INVALID_CREDENTIALS" }`. The response must not say which one was wrong.
- `DELETE /api/sessions` logs out.

## Balance

- `GET /api/me` → `{ "name", "email", "balance", "tier" }`, balance in whole naira, tier `"basic"` or `"plus"`.
- Without a session → `401 { "error": "UNAUTHENTICATED" }`.

## Sending money

`POST /api/transfers` with `{ "to": "<email>", "amount": <number>, "express": <boolean, optional> }`.

| Rule | Result |
| --- | --- |
| Amount is a whole number of naira from **₦100 up to and including ₦500,000** | Accepted |
| Amount below ₦100 (including 0 and negatives) | `422 AMOUNT_BELOW_MIN` |
| Amount above ₦500,000 | `422 AMOUNT_ABOVE_LIMIT` |
| Amount is not a whole number (text, decimals, missing) | `422 AMOUNT_INVALID` |
| Amount plus fee more than the sender's balance | `422 INSUFFICIENT_FUNDS` |
| Recipient email has no account | `422 RECIPIENT_NOT_FOUND` |
| Recipient is the sender | `422 SAME_ACCOUNT` |
| No session | `401 UNAUTHENTICATED` |

Checks run in the order above (amount first, then balance, then recipient).

An accepted transfer returns `201 { "id", "to", "amount", "fee", "express", "balance" }` with the sender's new balance. The sender pays amount + fee; the recipient receives exactly the amount.

In the web app, a rejected amount shows the message under the Amount field:

| Error | Message |
| --- | --- |
| `AMOUNT_BELOW_MIN` | Minimum is ₦100 |
| `AMOUNT_ABOVE_LIMIT` | Amount exceeds limit |
| `AMOUNT_INVALID` | Enter a whole number of naira |
| `INSUFFICIENT_FUNDS` | Not enough money in your account |
| `RECIPIENT_NOT_FOUND` | No Kudi account with that email |
| `SAME_ACCOUNT` | You can't send money to yourself |

## Fees

The fee depends on the sender's tier, the amount, and whether the transfer is express.

| Rule | Tier | Amount | Express | Fee |
| --- | --- | --- | --- | --- |
| R1 | Plus | any | no | ₦0 |
| R2 | Plus | any | yes | ₦50 |
| R3 | Basic | up to ₦5,000 | no | ₦10 |
| R4 | Basic | over ₦5,000 | no | ₦25 |
| R5 | Basic | any | yes | ₦100 |

`GET /api/fees?amount=<number>&express=<true|false>` → `{ "fee" }` for the signed-in user, without moving money. The amount is validated as in *Sending money*.

## Card

A card is always **active**, **frozen** or **blocked**.

| From \\ action | freeze | unfreeze | block |
| --- | --- | --- | --- |
| active | → frozen | refuse | → blocked |
| frozen | refuse | → active | → blocked |
| blocked | refuse | refuse | refuse |

Blocked is final: nothing moves a card out of it.

- `GET /api/card` → `{ "state" }`
- `POST /api/card/freeze`, `/unfreeze`, `/block` → `200 { "state" }` with the new state
- A refused move → `409 { "error": "INVALID_TRANSITION", "state": "<unchanged state>" }`, and the card does not change
- Any other action → `404 { "error": "UNKNOWN_ACTION" }`

## History

`GET /api/transfers` → the signed-in user's transfers, newest first: `{ "id", "direction": "out" | "in", "counterparty", "amount", "createdAt" }`.
