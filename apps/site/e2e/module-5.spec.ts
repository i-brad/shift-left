import { expect, test, type Page } from '@playwright/test';

const next = (page: Page) => page.getByRole('button', { name: /^Next:/ });
const pick = (page: Page, group: string, name: string) => page.getByRole('group', { name: group, exact: true }).getByRole('button', { name, exact: true });

test.beforeEach(async ({ page }) => {
  await page.goto('/learn/structure');
  await page.evaluate(() => localStorage.clear());
});

test('structure: a page object turns 36 edits into 3', async ({ page }) => {
  await page.goto('/learn/structure#step-2');
  await page.getByRole('button', { name: /^36/ }).click();
  await expect(page.getByTestId('metric-places-to-fix')).toContainText('36');
  await next(page).click();
  await pick(page, 'Where locators live', 'a page object').click();
  await expect(page.getByTestId('metric-places-to-fix')).toContainText('3');
  await expect(next(page)).toBeEnabled();
});

test('flaky: fixing causes beats retries', async ({ page }) => {
  await page.goto('/learn/flaky#step-2');
  await page.getByRole('button', { name: /report says green/ }).click();
  await next(page).click();
  await pick(page, 'Retries', '2').click();
  await expect(next(page)).toBeDisabled();
  await pick(page, 'Retries', '0').click();
  await pick(page, 'Test data', 'Fresh user per test').click();
  await pick(page, 'Waits', 'Auto-wait').click();
  await expect(page.getByTestId('metric-flaky')).toContainText('0');
  await expect(next(page)).toBeEnabled();
});
