import { expect, test, type Page } from '@playwright/test';

const next = (page: Page) => page.getByRole('button', { name: /^Next:/ });
const check = (page: Page) => page.getByRole('button', { name: 'Check', exact: true });
const pick = (page: Page, group: string, name: string) => page.getByRole('group', { name: group, exact: true }).getByRole('button', { name, exact: true });

test.beforeEach(async ({ page }) => {
  await page.goto('/learn/k6');
  await page.evaluate(() => localStorage.clear());
});

test('k6: find the limit, then scale', async ({ page }) => {
  await page.goto('/learn/k6#step-2');
  await page.getByRole('button', { name: /^Requests queue/ }).click();
  await expect(page.getByTestId('load-200')).toHaveAttribute('data-passed', 'false');
  await next(page).click();
  await pick(page, 'Virtual users', '200').click();
  await page.getByRole('button', { name: /^Mark 200/ }).click();
  await expect(next(page)).toBeDisabled();
  await pick(page, 'Virtual users', '100').click();
  await page.getByRole('button', { name: /^Mark 100/ }).click();
  await expect(next(page)).toBeEnabled();
  await next(page).click();
  await pick(page, 'Servers', '2').click();
  await expect(next(page)).toBeEnabled();
});

test('capstone: rank the risks', async ({ page }) => {
  await page.goto('/learn/capstone');
  await page.getByRole('button', { name: /^What could go wrong/ }).click();
  await next(page).click();
  const place = async (item: string, zone: string) => page.getByRole('group', { name: `Place: ${item}` }).getByRole('button', { name: zone, exact: true }).click();
  await place('A schedule runs twice: money sent twice', 'High');
  await place('A cancelled schedule still runs', 'High');
  await place('Low balance: skipped with no notification', 'High');
  await place('Runs at 06:00 UTC instead of Lagos time', 'Medium');
  await place('Monthly on the 31st skips February', 'Medium');
  await place('Typo in the confirmation message', 'Low');
  await check(page).click();
  await expect(next(page)).toBeEnabled();
});

test('pact: request step then pipeline', async ({ page }) => {
  await page.goto('/learn/pact#step-3');
  await page.getByRole('button', { name: /^Checking the API/ }).click();
  await next(page).click();
  await page.getByRole('group', { name: 'Checks' }).getByRole('button', { name: /Pact/ }).click();
  await expect(next(page)).toBeEnabled();
});
