# Hints · 08

1. `base.extend<{ user: User }>({ user: async ({ request }, use) => use(await createUser(request)) })`.
2. Fixtures can depend on fixtures: `sendPage` takes `{ page, user }`.
3. An option fixture lets one `describe` change the data: `userData: [{}, { option: true }]`, then `test.use({ userData: { balance: 0 } })`.
4. Send to another factory user, not Tunde: Tunde is shared.
5. Basic tier: ₦5,000 costs ₦5,010. From ₦100,000 that leaves ₦94,990.
