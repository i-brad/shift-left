import { expect, test, type Page } from '@playwright/test';

const metric = (page: Page, name: string) => page.getByTestId(`metric-${name}`);
const next = (page: Page) => page.getByRole('button', { name: /^Next:/ });

test.beforeEach(async ({ page }) => {
  await page.goto('/learn/partitions-boundaries');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('starts on the happy path with one passing test', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Partitions and boundaries');
  await expect(metric(page, 'tests')).toContainText('1');
  await expect(page.getByTestId('post')).toHaveCount(1);
  await expect(page.getByText('₦5,000 ✓')).toBeVisible();
});

test('a learner can find the bug from the console', async ({ page }) => {
  await page.getByLabel('Try an amount').fill('500000');
  await page.getByRole('button', { name: 'Run test' }).click();
  await expect(page.locator('#probe-result')).toContainText('You found a bug at ₦500,000');
  await expect(page.getByTestId('your-post')).toHaveCount(1);
});

test('rejects input that is not a number', async ({ page }) => {
  await page.getByLabel('Try an amount').fill('abc');
  await page.getByRole('button', { name: 'Run test' }).click();
  await expect(page.locator('#probe-result')).toHaveText('Enter an amount in naira, like 250000.');
});

test('the production step is locked until the bug is reproduced', async ({ page }) => {
  await page.goto('/learn/partitions-boundaries#step-4');
  await page.reload();
  await expect(page.getByTestId('narration')).toContainText('A customer hits the limit');
  await expect(metric(page, 'escaped-bugs')).toHaveAttribute('data-tone', 'bad');
  await expect(next(page)).toBeDisabled();
  await expect(page.getByRole('button', { name: /Step 5: Boundaries \(locked\)/ })).toBeDisabled();

  await page.getByLabel('Try an amount').fill('500,000');
  await page.getByRole('button', { name: 'Run test' }).click();
  await expect(page.getByText('Goal complete ✓')).toBeVisible();
  await next(page).click();
  await expect(page.getByTestId('narration')).toContainText('Test the edges');
  await expect(metric(page, 'edges-covered')).toContainText('4 / 4');
  await expect(page.getByText('₦500,000 ✕', { exact: true })).toBeVisible();
});

test('flipping the validator to <= fixes the bug', async ({ page }) => {
  await page.goto('/learn/partitions-boundaries#step-4');
  await page.reload();
  await page.getByLabel('Try an amount').fill('500000');
  await page.getByRole('button', { name: 'Run test' }).click();
  await next(page).click();
  await next(page).click();

  await expect(page.getByTestId('narration')).toContainText('One character');
  await expect(next(page)).toBeDisabled();
  await page.getByRole('group', { name: 'Validator comparison at the maximum' }).getByRole('button', { name: '<=' }).click();
  await expect(metric(page, 'escaped-bugs')).toContainText('0');
  await expect(page.getByTestId('customer-request')).toHaveAttribute('data-status', 'sent');
  await expect(next(page)).toBeEnabled();
});

test('a deep link cannot skip an unmet goal', async ({ page }) => {
  await page.goto('/learn/partitions-boundaries#step-7');
  await page.reload();
  await expect(page.getByTestId('narration')).toContainText('A customer hits the limit');
});

test('arrow keys move between steps', async ({ page }) => {
  await page.locator('body').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('ArrowRight');
  await expect(page.getByTestId('narration')).toContainText('Throw volume at it');
  await expect(metric(page, 'tests')).toContainText('50');
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByTestId('narration')).toContainText('One test, all green');
});

test('go deeper opens the deep dive with its 3D diagram', async ({ page }) => {
  await page.getByRole('button', { name: /^Go deeper:/ }).click();
  await expect(page.locator('details.deep')).toHaveAttribute('open', '');
  await expect(page.getByRole('img', { name: 'Spec, app and verdict' })).toBeVisible();
});

test('lessons not built yet show a placeholder', async ({ page }) => {
  await page.goto('/learn/decision-tables');
  await expect(page.getByText('This lesson is planned but not built yet.')).toBeVisible();
  await expect(page.getByText('Covers CTFL FL-4.2.3.')).toBeVisible();
});
