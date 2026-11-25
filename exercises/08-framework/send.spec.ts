import { expect, test, type Page } from '@playwright/test';

/**
 * Exercise 08 · Framework. See README.md.
 * This file runs fully parallel on 4 workers. Every test resets the shared database
 * and uses seed Ada, and every test copies the same locators. Restructure it.
 */

async function logIn(page: Page, email: string, password: string) {
  await page.goto('/');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
}

test.beforeEach(async ({ request }) => {
  await request.post('/api/test/reset');
});

test('Ada sends ₦5,000 and her balance updates', async ({ page }) => {
  await logIn(page, 'ada@kudi.test', 'kudi-ada-pass');
  await page.getByLabel('Recipient email').fill('tunde@kudi.test');
  await page.getByLabel('Amount').fill('5,000');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByTestId('balance')).toHaveText('₦595,000');
});

test('the transfer shows in history', async ({ page }) => {
  await logIn(page, 'ada@kudi.test', 'kudi-ada-pass');
  await page.getByLabel('Recipient email').fill('tunde@kudi.test');
  await page.getByLabel('Amount').fill('5,000');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByTestId('transaction')).toHaveCount(1);
});

test('Ada starts with ₦600,000', async ({ page }) => {
  await logIn(page, 'ada@kudi.test', 'kudi-ada-pass');
  await expect(page.getByTestId('balance')).toHaveText('₦600,000');
});

test('Tunde cannot send more than he has', async ({ page }) => {
  await logIn(page, 'tunde@kudi.test', 'kudi-tunde-pass');
  await page.getByLabel('Recipient email').fill('ada@kudi.test');
  await page.getByLabel('Amount').fill('25,000');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByText('Not enough money in your account')).toBeVisible();
});

// TODO: a customer with ₦0 tries to send ₦100. Seed data can't do this; a factory can.
