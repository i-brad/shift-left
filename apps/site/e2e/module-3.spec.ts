import { expect, test, type Page } from '@playwright/test';

const next = (page: Page) => page.getByRole('button', { name: /^Next:/ });
const pick = (page: Page, group: string, name: string) => page.getByRole('group', { name: group, exact: true }).getByRole('button', { name, exact: true });
const send = (page: Page) => page.getByRole('button', { name: 'Send', exact: true }).click();

test.beforeEach(async ({ page }) => {
  await page.goto('/learn/http-for-testers');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('HTTP: collect 201, 401, 404 and 422', async ({ page }) => {
  await next(page).click();
  await next(page).click();
  await page.getByRole('button', { name: /The server/ }).click();
  await next(page).click();
  await expect(next(page)).toBeDisabled();
  await send(page);
  await expect(page.getByTestId('response')).toHaveAttribute('data-status', '201');
  await pick(page, 'Logged in as', 'Logged out').click();
  await send(page);
  await expect(page.getByTestId('response')).toHaveAttribute('data-status', '401');
  await pick(page, 'Logged in as', 'Ada').click();
  await pick(page, 'Body', 'amount as text').click();
  await send(page);
  await pick(page, 'Method', 'GET').click();
  await pick(page, 'Path', '/api/nope').click();
  await send(page);
  await expect(page.getByTestId('response')).toHaveAttribute('data-status', '404');
  await expect(next(page)).toBeEnabled();
});

test('authz: Ada can read transfer 9', async ({ page }) => {
  await page.goto('/learn/authn-authz#step-3');
  await page.getByRole('button', { name: '404', exact: true }).click();
  await pick(page, 'Path', '/api/transfers/9').click();
  await send(page);
  await expect(page.getByTestId('room-9')).toHaveAttribute('data-tone', 'rose');
  await expect(page.getByTestId('metric-matches-spec')).toContainText('no');
  await expect(next(page)).toBeEnabled();
});

test('asserting: shape catches the string amount', async ({ page }) => {
  await page.goto('/learn/asserting-responses#step-2');
  await page.getByRole('button', { name: "A check on each field's type" }).click();
  await next(page).click();
  await send(page);
  await expect(page.getByTestId('assert-result')).toContainText('bug got past');
  await page.getByRole('button', { name: 'Every field has the expected type' }).click();
  await expect(page.getByTestId('assert-result')).toContainText('caught the bug');
  await expect(next(page)).toBeEnabled();
});
