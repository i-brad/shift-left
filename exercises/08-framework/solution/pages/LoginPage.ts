import { expect, type Page } from '@playwright/test';

export class LoginPage {
  constructor(private readonly page: Page) {}

  async logIn(email: string, password: string) {
    await this.page.goto('/');
    await this.page.getByLabel('Email').fill(email);
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: 'Log in' }).click();
    await expect(this.page.getByTestId('balance')).toBeVisible();
  }
}
