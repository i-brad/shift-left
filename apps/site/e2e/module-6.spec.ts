import { expect, test, type Page } from '@playwright/test';

const next = (page: Page) => page.getByRole('button', { name: /^Next:/ });
const check = (page: Page) => page.getByRole('button', { name: 'Check', exact: true });
const stage = (page: Page, name: string) => page.getByRole('group', { name: 'Checks' }).getByRole('button', { name });

test.beforeEach(async ({ page }) => {
  await page.goto('/learn/pr-checks');
  await page.evaluate(() => localStorage.clear());
});

test('PR checks: fit the 5-minute budget', async ({ page }) => {
  await page.goto('/learn/pr-checks#step-2');
  await page.getByRole('button', { name: /^Batch changes/ }).click();
  await next(page).click();
  for (const s of ['Unit tests', 'API tests', 'UI smoke (5 tests)']) await stage(page, s).click();
  await expect(page.getByTestId('metric-run-time')).toContainText('270 s');
  await expect(next(page)).toBeEnabled();
});

test('secrets: sort where values live', async ({ page }) => {
  await page.goto('/learn/secrets#step-2');
  const place = async (item: string, zone: string) => page.getByRole('group', { name: `Place: ${item}` }).getByRole('button', { name: zone, exact: true }).click();
  await place('Staging base URL', 'In the repo');
  await place('kudi-ada-pass for local Kudi', 'In the repo');
  await place('Test user password on staging', 'CI secret');
  await place('Payment provider sandbox API key', 'CI secret');
  await place('Slack webhook for test reports', 'CI secret');
  await place('Production database password', 'Not in tests at all');
  await place("A real customer's card number", 'Not in tests at all');
  await check(page).click();
  await expect(next(page)).toBeEnabled();
});
