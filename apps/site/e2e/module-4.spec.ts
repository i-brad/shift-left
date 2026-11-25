import { expect, test, type Page } from '@playwright/test';

const next = (page: Page) => page.getByRole('button', { name: /^Next:/ });
const pick = (page: Page, group: string, name: string) => page.getByRole('group', { name: group, exact: true }).getByRole('button', { name, exact: true });

test.beforeEach(async ({ page }) => {
  await page.goto('/learn/locators');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('locators: XPath snaps on redesign; label and role hold', async ({ page }) => {
  await pick(page, 'Locator: Recipient field', 'XPath').click();
  await expect(page.getByTestId('el-recipient')).toHaveAttribute('data-state', 'found');
  await next(page).click();
  await page.getByRole('button', { name: 'Role, label and test id' }).click();
  await expect(page.getByTestId('el-recipient')).toHaveAttribute('data-state', 'lost');
  await next(page).click();
  await expect(next(page)).toBeDisabled();
  await pick(page, 'Locator: Recipient field', 'Label').click();
  await pick(page, 'Locator: Amount field', 'Role').click();
  await pick(page, 'Locator: Send button', 'Test id').click();
  await pick(page, 'Locator: Balance', 'Text').click();
  await expect(next(page)).toBeDisabled();
  await pick(page, 'Locator: Balance', 'Test id').click();
  await expect(next(page)).toBeEnabled();
});

test('waiting: auto-wait passes every run', async ({ page }) => {
  await page.goto('/learn/waiting#step-2');
  await page.getByRole('button', { name: '6', exact: true }).click();
  await expect(page.getByTestId('metric-runs-passed')).toContainText('6 / 10');
  await next(page).click();
  await pick(page, 'Strategy', 'Auto-wait').click();
  await expect(page.getByTestId('metric-runs-passed')).toContainText('10 / 10');
  await expect(next(page)).toBeEnabled();
});

test('fixtures: fresh data per test survives 4 workers', async ({ page }) => {
  await page.goto('/learn/fixtures#step-2');
  await page.getByRole('button', { name: /^Three/ }).click();
  await next(page).click();
  await pick(page, 'Test data', 'Reset DB before each test').click();
  await expect(next(page)).toBeEnabled();
  await next(page).click();
  await expect(next(page)).toBeDisabled();
  await pick(page, 'Test data', 'Fresh user per test').click();
  await expect(page.getByTestId('metric-false-failures')).toContainText('0');
  await expect(next(page)).toBeEnabled();
});

test('traces: find the stale GET /me', async ({ page }) => {
  await page.goto('/learn/traces');
  await page.getByRole('button', { name: "Can't tell yet" }).click();
  await next(page).click();
  await page.getByRole('group', { name: 'Trace frames' }).getByRole('button', { name: /^5\./ }).click();
  await expect(page.locator('#probe-result')).toContainText('GET /api/me → 200');
  await expect(next(page)).toBeEnabled();
});
