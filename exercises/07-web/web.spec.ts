import { expect, test, type Page } from '@playwright/test';

/**
 * Exercise 07 · Web automation. See README.md.
 * With the "bug" on, Kudi ships its redesign, the network is slow (1.2 s per call),
 * and there is one real bug. These tests fail, mostly for the wrong reasons. Fix the tests
 * until the only red is the real bug, then find it with the trace.
 */

async function logInAsAda(page: Page) {
  await page.goto('/');
  await page.locator('#email').fill('ada@kudi.test');
  await page.locator('#password').fill('kudi-ada-pass');
  await page.locator('//form/button').click();
  await page.waitForTimeout(500);
}

test.beforeEach(async ({ request }) => {
  await request.post('/api/test/reset');
});

test('Ada sends ₦5,000 and her balance updates', async ({ page }) => {
  await logInAsAda(page);
  await page.locator('#to').fill('tunde@kudi.test');
  await page.locator('.transfer .amount input').fill('5,000');
  await page.getByText('Send', { exact: true }).click();
  await page.waitForTimeout(500);
  expect(await page.getByTestId('balance').textContent()).toBe('₦595,000');
});

test('the transfer shows in history', async ({ page }) => {
  await logInAsAda(page);
  await page.locator('#to').fill('tunde@kudi.test');
  await page.locator('.transfer .amount input').fill('5,000');
  await page.getByText('Send', { exact: true }).click();
  await page.waitForTimeout(500);
  expect(await page.locator('[data-testid=transaction]').first().textContent()).toContain('To tunde@kudi.test');
});

test('an amount over the limit shows the spec message', async ({ page }) => {
  await logInAsAda(page);
  await page.locator('#to').fill('tunde@kudi.test');
  await page.locator('.transfer .amount input').fill('500001');
  await page.getByText('Send', { exact: true }).click();
  await page.waitForTimeout(500);
  expect(await page.locator('.field-error').textContent()).toBe('Amount exceeds limit');
});
