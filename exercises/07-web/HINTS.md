# Hints · 07

1. The labels on the login form are "Email" and "Password". On the Send form: "Recipient email" and "Amount".
2. `getByRole('button', { name: 'Send' })` matches "Send money" too: names match as a case-insensitive substring unless you pass `exact: true`.
3. `toHaveText`, `toContainText` and `toHaveAccessibleDescription` all wait. `textContent()` doesn't.
4. A fixture: `const test = base.extend<{ ada: Page }>({ ada: async ({ page, request }, use) => { …; await use(page); } })`.
5. In the trace, open the Network tab on the frame after Send. Compare the balance in `POST /api/transfers` with the one in the next `GET /api/me`.
