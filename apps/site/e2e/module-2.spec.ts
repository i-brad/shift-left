import { expect, test, type Page } from '@playwright/test';

const next = (page: Page) => page.getByRole('button', { name: /^Next:/ });
const check = (page: Page) => page.getByRole('button', { name: 'Check', exact: true });

test.beforeEach(async ({ page }) => {
  await page.goto('/learn/exploratory');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('exploratory: the charter board unlocks Next only when every pick is right', async ({ page }) => {
  await expect(next(page)).toBeDisabled();
  for (const n of ['Type "500,000" with commas', 'Type "100.50" (kobo)', 'Type "-500"', 'Type "000100" with leading zeros', 'Type an 11-digit number', 'Switch the app to dark mode']) {
    await page.getByRole('button', { name: n }).click();
  }
  await check(page).click();
  await expect(page.getByTestId('tile-dark')).toHaveAttribute('data-status', 'wrong');
  await expect(next(page)).toBeDisabled();
  await page.getByRole('button', { name: 'Switch the app to dark mode' }).click();
  await check(page).click();
  await expect(page.locator('#probe-result')).toHaveText('All right.');
  await expect(next(page)).toBeEnabled();
});

test('defect reports: sorting by severity and priority', async ({ page }) => {
  await page.goto('/learn/defect-reports');
  const pick = async (item: string, zone: string) => page.getByRole('group', { name: `Place: ${item}` }).getByRole('button', { name: zone }).click();
  for (const b of ['A title naming what, where and the wrong result', 'Numbered steps to reproduce', "Expected result, with where it's specified", 'Actual result', 'Environment: version, browser, server', 'Test data: account, amount, express', 'Screenshot, trace or API response']) {
    await page.getByRole('button', { name: b }).click();
  }
  await check(page).click();
  await next(page).click();
  for (const b of ['Transfer of exactly ₦500,000 rejected as "Amount exceeds limit"', 'Plus express transfers charged ₦100 instead of ₦50', 'Blocked card can be reactivated with Unfreeze']) {
    await page.getByRole('button', { name: b }).click();
  }
  await check(page).click();
  await next(page).click();
  await pick('A blocked card can be reactivated', 'High sev · High pri');
  await pick('Plus customers overcharged on express', 'High sev · High pri');
  await pick('Company name misspelled on the home page', 'Low sev · High pri');
  await pick('Crash when exporting 10 years of history (2 users ever tried)', 'High sev · Low pri');
  await pick('Tooltip 2px off on the settings page', 'Low sev · Low pri');
  await check(page).click();
  await expect(page.getByTestId('metric-score')).toContainText('100%');
  await expect(next(page)).toBeEnabled();
});

test('coverage: one test is 100% statements, a Basic test finds NaN, the fix turns it green', async ({ page }) => {
  await page.goto('/learn/coverage');
  await expect(page.getByTestId('metric-statements')).toContainText('6 / 6');
  await expect(page.getByTestId('metric-branches')).toContainText('2 / 4');
  await next(page).click();
  await page.getByRole('button', { name: 'Not necessarily' }).click();
  await next(page).click();
  await next(page).click();
  await expect(next(page)).toBeDisabled();
  await page.getByRole('group', { name: 'Test tier' }).getByRole('button', { name: 'Basic' }).click();
  await page.getByRole('button', { name: 'Add test' }).click();
  await expect(page.locator('#probe-result')).toContainText('₦NaN');
  await expect(next(page)).toBeEnabled();
  await next(page).click();
  await page.getByRole('button', { name: '2', exact: true }).click();
  await next(page).click();
  await page.getByRole('group', { name: 'rate declaration' }).getByRole('button', { name: 'let rate = 0;' }).click();
  await expect(page.getByTestId('metric-failing')).toContainText('0');
  await expect(next(page)).toBeEnabled();
});

test('acceptance criteria: Given / When / Then sorting', async ({ page }) => {
  await page.goto('/learn/acceptance-criteria');
  for (const b of ['Given a Plus customer, when they send ₦3,000 by express, then the fee is ₦50', 'The fee is shown before the customer confirms', 'Given a Basic customer, when they send by express, then the fee is still ₦100', "If the balance can't cover amount + fee, the transfer is refused with \"Not enough money in your account\""]) {
    await page.getByRole('button', { name: b }).click();
  }
  await check(page).click();
  await next(page).click();
  const place = async (item: string, zone: string) => page.getByRole('group', { name: `Place: ${item}` }).getByRole('button', { name: zone, exact: true }).click();
  await place('a Plus customer with ₦10,000', 'Given');
  await place('their card is frozen', 'Given');
  await place('they send ₦3,000 by express', 'When');
  await place('they open Send money', 'When');
  await place('the fee is ₦50', 'Then');
  await place('their balance is ₦6,950', 'Then');
  await check(page).click();
  await expect(next(page)).toBeEnabled();
});
