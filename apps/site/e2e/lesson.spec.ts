import { expect, test, type Page } from '@playwright/test';

const metric = (page: Page, name: string) => page.getByTestId(`metric-${name}`);
const next = (page: Page) => page.getByRole('button', { name: /^Next:/ });
const narration = (page: Page) => page.getByTestId('narration');

/** Walk from step 1 to the production step, answering the partitions prediction on the way. */
async function toProductionStep(page: Page) {
  await next(page).click();
  await next(page).click();
  await expect(narration(page)).toContainText('Split the input into groups');
  await page.getByRole('button', { name: 'No, something can still slip through' }).click();
  await next(page).click();
  await expect(narration(page)).toContainText('A customer hits the limit');
}

async function reproduce(page: Page) {
  await page.getByLabel('Try an amount').fill('500,000');
  await page.getByRole('button', { name: 'Run test' }).click();
}

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

test('glossary terms explain themselves inline', async ({ page }) => {
  await narration(page).getByRole('button', { name: 'spec', exact: true }).click();
  await expect(narration(page).getByRole('note')).toContainText('The written description of how a feature should behave');
});

test('a learner can find the bug from the console', async ({ page }) => {
  await reproduce(page);
  await expect(page.locator('#probe-result')).toContainText('You found a bug at ₦500,000');
  await expect(page.getByTestId('your-post')).toHaveCount(1);
});

test('rejects input that is not a number', async ({ page }) => {
  await page.getByLabel('Try an amount').fill('abc');
  await page.getByRole('button', { name: 'Run test' }).click();
  await expect(page.locator('#probe-result')).toHaveText('Enter an amount in naira, like 250000.');
});

test('the partitions step needs a prediction and explains the answer', async ({ page }) => {
  await next(page).click();
  await next(page).click();
  await expect(next(page)).toBeDisabled();
  await expect(page.getByText('Make your prediction to continue.')).toBeVisible();
  await page.getByRole('button', { name: 'Yes, they cover every group' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Not quite.' })).toBeVisible();
  await expect(next(page)).toBeEnabled();
});

test('production is locked until the bug is reproduced, and boundary results stay hidden until predicted', async ({ page }) => {
  await toProductionStep(page);
  await expect(metric(page, 'escaped-bugs')).toHaveAttribute('data-tone', 'bad');
  await expect(next(page)).toBeDisabled();
  await expect(page.getByRole('button', { name: /Step 5: Boundaries \(locked\)/ })).toBeDisabled();

  await reproduce(page);
  await expect(page.getByText('Goal complete ✓')).toBeVisible();
  await next(page).click();
  await expect(narration(page)).toContainText('Test the edges');
  await expect(page.getByTestId('your-post')).toHaveCount(0);
  await expect(narration(page)).not.toContainText('WHAT CHANGED');
  await expect(page.locator('[data-testid="post"][data-result="fail"]')).toHaveCount(0);
  await expect(page.getByText('₦500,000 ?', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: '₦500,000', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Right.' })).toBeVisible();
  await expect(page.getByText('₦500,000 ✕', { exact: true })).toBeVisible();
  await expect(metric(page, 'edges-covered')).toContainText('4 / 4');
});

test('flipping the validator to <= fixes the bug', async ({ page }) => {
  await toProductionStep(page);
  await reproduce(page);
  await next(page).click();
  await page.getByRole('button', { name: '₦99', exact: true }).click();
  await next(page).click();

  await expect(narration(page)).toContainText('One character');
  await expect(next(page)).toBeDisabled();
  await page.getByRole('group', { name: 'Validator comparison at the maximum' }).getByRole('button', { name: '<=' }).click();
  await expect(metric(page, 'escaped-bugs')).toContainText('0');
  await expect(page.getByTestId('customer-request')).toHaveAttribute('data-status', 'sent');
  await expect(next(page)).toBeEnabled();
});

test('the last step has a check with explanations', async ({ page }) => {
  await toProductionStep(page);
  await reproduce(page);
  await next(page).click();
  await page.getByRole('button', { name: '₦500,000', exact: true }).click();
  await next(page).click();
  await page.getByRole('group', { name: 'Validator comparison at the maximum' }).getByRole('button', { name: '<=' }).click();
  await next(page).click();
  await next(page).click();
  await expect(page.getByRole('heading', { name: 'Check yourself' })).toBeVisible();
  await page.getByLabel('7, 8, 64, 65').check();
  await expect(page.getByText('Both sides of both edges')).toBeVisible();
  await expect(page.getByText('1 / 3 answered')).toBeVisible();
});

test('a deep link cannot skip an unfinished step', async ({ page }) => {
  await page.goto('/learn/partitions-boundaries#step-7');
  await page.reload();
  await expect(narration(page)).toContainText('Split the input into groups');
});

test('arrow keys move between steps', async ({ page }) => {
  await page.locator('body').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('ArrowRight');
  await expect(narration(page)).toContainText('Throw volume at it');
  await expect(metric(page, 'tests')).toContainText('50');
  await page.keyboard.press('ArrowLeft');
  await expect(narration(page)).toContainText('One test, all green');
});

test('go deeper opens the deep dive with its 3D diagram', async ({ page }) => {
  await page.getByRole('button', { name: /^Go deeper:/ }).click();
  await expect(page.locator('details.deep')).toHaveAttribute('open', '');
  await expect(page.getByRole('img', { name: 'Spec, app and verdict' })).toBeVisible();
});

test('the team checklist is always visible', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Use it on your team' })).toBeVisible();
});

test('lessons not built yet show a placeholder', async ({ page }) => {
  await page.goto('/learn/decision-tables');
  await expect(page.getByText('This lesson is planned but not built yet.')).toBeVisible();
  await expect(page.getByText('Covers CTFL FL-4.2.3.')).toBeVisible();
});
