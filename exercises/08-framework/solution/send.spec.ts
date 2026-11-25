import { createUser, expect, test } from './fixtures';

/** Reference solution for exercise 08. Runs in parallel; each test owns its data. */

test('a user sends ₦5,000 and the balance updates', async ({ sendPage, request }) => {
  const friend = await createUser(request);
  await sendPage.send(friend.email, '5,000');
  await expect(sendPage.balance()).toHaveText('₦94,990');
});

test('the transfer shows in history', async ({ sendPage, request }) => {
  const friend = await createUser(request);
  await sendPage.send(friend.email, '5,000');
  await expect(sendPage.history()).toHaveCount(1);
});

test('a new user starts with the balance they were given', async ({ sendPage }) => {
  await expect(sendPage.balance()).toHaveText('₦100,000');
});

test.describe('Plus', () => {
  test.use({ userData: { tier: 'plus', balance: 50_000 } });
  test('pays no standard fee', async ({ sendPage, request }) => {
    const friend = await createUser(request);
    await sendPage.send(friend.email, '5,000');
    await expect(sendPage.confirmation()).toContainText('(fee ₦0)');
  });
});

test.describe('an empty account', () => {
  test.use({ userData: { balance: 0 } });
  test('is refused with the spec message', async ({ sendPage, request }) => {
    const friend = await createUser(request);
    await sendPage.send(friend.email, '100');
    await expect(sendPage.error('Not enough money in your account')).toBeVisible();
  });
});
