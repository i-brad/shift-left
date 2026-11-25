import type { Page } from '@playwright/test';

/** The home page's Send form and balance. Locators and actions only; assertions live in tests. */
export class SendPage {
  constructor(private readonly page: Page) {}

  readonly balance = () => this.page.getByTestId('balance');
  readonly history = () => this.page.getByTestId('transaction');
  readonly confirmation = () => this.page.getByRole('status');
  readonly error = (message: string) => this.page.getByText(message);

  async send(to: string, naira: string) {
    await this.page.getByLabel('Recipient email').fill(to);
    await this.page.getByLabel('Amount').fill(naira);
    await this.page.getByRole('button', { name: 'Send' }).click();
  }
}
