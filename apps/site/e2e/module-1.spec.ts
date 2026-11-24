import { expect, test, type Page } from '@playwright/test';

const next = (page: Page) => page.getByRole('button', { name: /^Next:/ });
const check = (page: Page) => page.getByRole('button', { name: 'Check', exact: true });
const stage = (page: Page, name: string) => page.getByRole('group', { name: 'Checks' }).getByRole('button', { name });

test.beforeEach(async ({ page }) => {
  await page.goto('/learn/why-we-test');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('why we test: build a pipeline that lets nothing through for under ₦100,000', async ({ page }) => {
  await expect(page.getByTestId('metric-reached-customers')).toContainText('5');
  await next(page).click();
  await next(page).click();
  await page.getByRole('button', { name: 'In the spec, before code exists' }).click();
  await next(page).click();
  await expect(next(page)).toBeDisabled();
  for (const s of ['Spec review', 'Unit tests', 'API tests']) await stage(page, s).click();
  await expect(page.getByTestId('defect-button')).toHaveAttribute('data-at', 'prod');
  await stage(page, 'UI tests').click();
  await expect(page.getByTestId('metric-reached-customers')).toContainText('0');
  await expect(next(page)).toBeEnabled();
});

test('test levels: only acceptance catches the business defect', async ({ page }) => {
  await page.goto('/learn/test-levels');
  await next(page).click();
  await next(page).click();
  await page.getByRole('button', { name: 'Acceptance', exact: true }).click();
  await expect(page.getByTestId('defect-business')).toHaveAttribute('data-at', 'prod');
  await next(page).click();
  for (const s of ['Integration', 'System', 'Acceptance']) await stage(page, s).click();
  await expect(page.getByTestId('metric-reached-customers')).toContainText('0');
  await expect(next(page)).toBeEnabled();
});

test('errors, defects, failures: sort the chain', async ({ page }) => {
  await page.goto('/learn/errors-defects-failures');
  const place = async (item: string, zone: string) => page.getByRole('group', { name: `Place: ${item}` }).getByRole('button', { name: zone, exact: true }).click();
  await place('Developer read "up to and including" as "less than"', 'Error');
  await place('`amount < MAX` in validator.ts', 'Defect');
  await place("A customer's ₦500,000 transfer is refused", 'Failure');
  await place('An analyst wrote the fee rules in an order that contradicts the table', 'Error');
  await place('fees.ts checks express before tier', 'Defect');
  await place('A Plus customer is charged ₦100 for express', 'Failure');
  await check(page).click();
  await expect(next(page)).toBeEnabled();
});

test('planning: three-point estimate prediction explains the maths', async ({ page }) => {
  await page.goto('/learn/planning-reporting');
  const place = async (item: string, zone: string) => page.getByRole('group', { name: `Place: ${item}` }).getByRole('button', { name: zone, exact: true }).click();
  for (const i of ['The build is deployed to the test environment', 'Test accounts and data are seeded', 'The spec and acceptance criteria are reviewed']) await place(i, 'Entry');
  for (const i of ['All high-risk areas have been tested', 'No open critical defects', 'Branch coverage of new code is at least 80%']) await place(i, 'Exit');
  await check(page).click();
  await next(page).click();
  await page.getByRole('button', { name: '5 days' }).click();
  await expect(page.getByRole('status').filter({ hasText: '30 ÷ 6 = 5' })).toBeVisible();
});
