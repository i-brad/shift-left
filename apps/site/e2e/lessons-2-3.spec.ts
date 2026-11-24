import { expect, test, type Page } from '@playwright/test';

const next = (page: Page) => page.getByRole('button', { name: /^Next:/ });
const narration = (page: Page) => page.getByTestId('narration');
const metric = (page: Page, name: string) => page.getByTestId(`metric-${name}`);

test.beforeEach(async ({ page }) => {
  await page.goto('/learn/decision-tables');
  await page.evaluate(() => localStorage.clear());
});

test('decision tables: find the Plus + express bug and fix the rule order', async ({ page }) => {
  await page.goto('/learn/decision-tables');
  await expect(page.getByTestId('combo-cube')).toBeVisible();
  await next(page).click();
  await expect(metric(page, 'combinations')).toContainText('4 / 8');
  await next(page).click();
  await page.getByRole('button', { name: '8', exact: true }).click();
  await next(page).click();

  await expect(narration(page)).toContainText('A Plus customer pays ₦100');
  await expect(next(page)).toBeDisabled();
  await page.getByRole('group', { name: 'Tier' }).getByRole('button', { name: 'Plus' }).click();
  await page.getByRole('group', { name: 'Delivery' }).getByRole('button', { name: 'Express' }).click();
  await expect(page.locator('#probe-result')).toContainText('Kudi: ₦100');
  await next(page).click();

  await expect(page.getByTestId('cell-plus-low-express')).toHaveAttribute('data-result', 'hidden');
  await page.getByRole('button', { name: 'Plus + express, both amounts' }).click();
  await expect(page.getByTestId('cell-plus-low-express')).toHaveAttribute('data-result', 'fail');
  await expect(page.getByTestId('cell-basic-low-express')).toHaveAttribute('data-result', 'pass');
  await next(page).click();
  await expect(metric(page, 'rules-covered')).toContainText('5 / 5');
  await next(page).click();

  await expect(next(page)).toBeDisabled();
  await page.getByRole('group', { name: 'Fee rule order' }).getByRole('button', { name: 'tier first' }).click();
  await expect(metric(page, 'escaped-bugs')).toContainText('0');
  await expect(next(page)).toBeEnabled();
});

test('state transitions: reproduce the stolen card and fix unfreeze', async ({ page }) => {
  await page.goto('/learn/state-transitions');
  await page.getByRole('button', { name: 'Freeze', exact: true }).click();
  await expect(page.getByTestId('your-card')).toHaveAttribute('data-state', 'frozen');
  await next(page).click();
  await expect(metric(page, 'allowed-moves')).toContainText('4 / 4');
  await next(page).click();
  await page.getByRole('button', { name: '5', exact: true }).click();
  await next(page).click();

  await expect(narration(page)).toContainText('A blocked card comes back');
  await page.getByRole('button', { name: 'Reset card' }).click();
  await page.getByRole('button', { name: 'Block', exact: true }).click();
  await page.getByRole('button', { name: 'Unfreeze', exact: true }).click();
  await expect(page.locator('#probe-result')).toContainText('FAIL');
  await expect(page.getByTestId('your-card')).toHaveAttribute('data-state', 'active');
  await next(page).click();

  await page.getByRole('button', { name: 'blocked → unfreeze' }).click();
  await expect(page.getByTestId('refusal-blocked:unfreeze')).toHaveAttribute('data-result', 'fail');
  await expect(page.getByTestId('refusal-blocked:freeze')).toHaveAttribute('data-result', 'pass');
  await next(page).click();

  await page.getByRole('group', { name: 'Unfreeze allowed from' }).getByRole('button', { name: 'frozen only' }).click();
  await expect(metric(page, 'failing')).toContainText('0');
  await expect(next(page)).toBeEnabled();
});
