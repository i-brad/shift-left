# Kudi spec

Kudi is a made-up fintech app that exists to be tested. This file is the **test oracle**: when Kudi and this spec disagree, Kudi is wrong (or the spec is unclear — that's a finding too).

## Accounts

| Name | Email | Password | Starting balance |
| --- | --- | --- | --- |
| Ada | ada@kudi.test | kudi-ada-pass | ₦600,000 |
| Tunde | tunde@kudi.test | kudi-tunde-pass | ₦20,000 |

These are test accounts in a local database. `POST /api/test/reset` restores them.

## Logging in

- `POST /api/sessions` with `{ "email", "password" }`.
- Correct details → `201` and a `kudi_session` cookie.
- Wrong email **or** wrong password → `401 { "error": "INVALID_CREDENTIALS" }`. The response must not say which one was wrong.
- `DELETE /api/sessions` logs out.

## Balance

- `GET /api/me` → `{ "name", "email", "balance" }`, balance in whole naira.
- Without a session → `401 { "error": "UNAUTHENTICATED" }`.

## Sending money

`POST /api/transfers` with `{ "to": "<email>", "amount": <number> }`.

| Rule | Result |
| --- | --- |
| Amount is a whole number of naira from **₦100 up to and including ₦500,000** | Accepted |
| Amount below ₦100 (including 0 and negatives) | `422 AMOUNT_BELOW_MIN` |
| Amount above ₦500,000 | `422 AMOUNT_ABOVE_LIMIT` |
| Amount is not a whole number (text, decimals, missing) | `422 AMOUNT_INVALID` |
| Amount more than the sender's balance | `422 INSUFFICIENT_FUNDS` |
| Recipient email has no account | `422 RECIPIENT_NOT_FOUND` |
| Recipient is the sender | `422 SAME_ACCOUNT` |
| No session | `401 UNAUTHENTICATED` |

Checks run in the order above (amount first, then balance, then recipient).

An accepted transfer returns `201 { "id", "to", "amount", "balance" }` with the sender's new balance, and both balances change by exactly the amount. There are no fees (yet).

In the web app, a rejected amount shows the message under the Amount field:

| Error | Message |
| --- | --- |
| `AMOUNT_BELOW_MIN` | Minimum is ₦100 |
| `AMOUNT_ABOVE_LIMIT` | Amount exceeds limit |
| `AMOUNT_INVALID` | Enter a whole number of naira |
| `INSUFFICIENT_FUNDS` | Not enough money in your account |
| `RECIPIENT_NOT_FOUND` | No Kudi account with that email |
| `SAME_ACCOUNT` | You can't send money to yourself |

## History

`GET /api/transfers` → the signed-in user's transfers, newest first: `{ "id", "direction": "out" | "in", "counterparty", "amount", "createdAt" }`.
