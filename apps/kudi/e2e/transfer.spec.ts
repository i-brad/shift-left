import { expect, test } from '@playwright/test';

test.beforeEach(async ({ request }) => {
  await request.post('/api/test/reset');
});

async function logIn(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByLabel('Email').fill('ada@kudi.test');
  await page.getByLabel('Password').fill('kudi-ada-pass');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByTestId('balance')).toHaveText('₦600,000');
}

test('wrong password gives a message that does not say which field was wrong', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Email').fill('ada@kudi.test');
  await page.getByLabel('Password').fill('wrong');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByRole('alert')).toHaveText('Email or password is incorrect');
});

test('sending money updates balance and history', async ({ page }) => {
  await logIn(page);
  await page.getByLabel('Recipient email').fill('tunde@kudi.test');
  await page.getByLabel('Amount').fill('5,000');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByRole('status')).toHaveText('Sent ₦5,000 to tunde@kudi.test (fee ₦0)');
  await expect(page.getByTestId('balance')).toHaveText('₦595,000');
  await expect(page.getByTestId('transaction').first()).toContainText('To tunde@kudi.test');
});

test('an amount over the limit shows the spec message under the field', async ({ page }) => {
  await logIn(page);
  await page.getByLabel('Recipient email').fill('tunde@kudi.test');
  await page.getByLabel('Amount').fill('500001');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByLabel('Amount')).toHaveAccessibleDescription('Amount exceeds limit');
  await expect(page.getByTestId('balance')).toHaveText('₦600,000');
});

test('freezing, unfreezing and blocking the card', async ({ page }) => {
  await logIn(page);
  const state = page.getByTestId('card-state');
  await expect(state).toHaveText('Active');
  await page.getByRole('button', { name: 'Freeze' }).click();
  await expect(state).toHaveText('Frozen');
  await page.getByRole('button', { name: 'Unfreeze' }).click();
  await expect(state).toHaveText('Active');
  await page.getByRole('button', { name: 'Block card' }).click();
  await expect(state).toHaveText('Blocked');
  await expect(page.getByRole('button', { name: 'Unfreeze' })).toHaveCount(0);
});
