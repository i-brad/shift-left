import { expect, test as base, type Page } from '@playwright/test';

/**
 * Reference solution for exercise 07. User-facing locators, web-first assertions, a fixture for login.
 * With the switches on, only the balance test fails: GET /api/me returns a stale balance (see the trace).
 */
const test = base.extend<{ ada: Page }>({
  ada: async ({ page, request }, use) => {
    await request.post('/api/test/reset');
    await page.goto('/');
    await page.getByLabel('Email').fill('ada@kudi.test');
    await page.getByLabel('Password').fill('kudi-ada-pass');
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page.getByTestId('balance')).toHaveText('₦600,000');
    await use(page);
  },
});

async function send(page: Page, to: string, amount: string) {
  await page.getByLabel('Recipient email').fill(to);
  await page.getByLabel('Amount').fill(amount);
  await page.getByRole('button', { name: 'Send' }).click();
}

test('Ada sends ₦5,000 and her balance updates', async ({ ada }) => {
  await send(ada, 'tunde@kudi.test', '5,000');
  await expect(ada.getByRole('status')).toHaveText('Sent ₦5,000 to tunde@kudi.test (fee ₦0)');
  await expect(ada.getByTestId('balance')).toHaveText('₦595,000');
});

test('the transfer shows in history', async ({ ada }) => {
  await send(ada, 'tunde@kudi.test', '5,000');
  await expect(ada.getByTestId('transaction').first()).toContainText('To tunde@kudi.test');
});

test('an amount over the limit shows the spec message', async ({ ada }) => {
  await send(ada, 'tunde@kudi.test', '500001');
  await expect(ada.getByLabel('Amount')).toHaveAccessibleDescription('Amount exceeds limit');
});
