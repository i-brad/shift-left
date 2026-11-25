/**
 * Kudi's transfer page as data, for Module 4/5/7 lessons on locators, page objects and traces.
 * A locator "holds" after a change if it still finds the same, single element.
 */

export type LocatorKind = 'css-id' | 'css-class' | 'xpath' | 'text' | 'role' | 'label' | 'testid';
export type PageChange = 'redesign' | 'data';
export type PageElementId = 'recipient' | 'amount' | 'send' | 'balance';

export const LOCATOR_KINDS: { id: LocatorKind; label: string }[] = [
  { id: 'css-id', label: 'CSS id' },
  { id: 'css-class', label: 'CSS class' },
  { id: 'xpath', label: 'XPath' },
  { id: 'text', label: 'Text' },
  { id: 'role', label: 'Role' },
  { id: 'label', label: 'Label' },
  { id: 'testid', label: 'Test id' },
];

export const PAGE_CHANGES: { id: PageChange; label: string }[] = [
  { id: 'redesign', label: 'Redesign ships' },
  { id: 'data', label: "Ada's balance changes" },
];

type Option = { code: string; breaks: PageChange[]; why?: string };
export type PageElement = { id: PageElementId; label: string; options: Partial<Record<LocatorKind, Option>> };

/** For each element, the locator of each kind a tester might write, and which changes break it. Missing = not possible. */
export const PAGE_ELEMENTS: PageElement[] = [
  {
    id: 'recipient',
    label: 'Recipient field',
    options: {
      'css-id': { code: "locator('#to')", breaks: ['redesign'], why: 'The redesign renamed the id to recipient-input.' },
      'css-class': { code: "locator('.transfer .field:nth-of-type(1) input')", breaks: ['redesign'], why: 'The form lost its .transfer class and the fields swapped order.' },
      xpath: { code: "locator('//form/div[1]/input')", breaks: ['redesign'], why: 'The fields moved into a new wrapper div.' },
      role: { code: "getByRole('textbox', { name: 'Recipient email' })", breaks: [] },
      label: { code: "getByLabel('Recipient email')", breaks: [] },
    },
  },
  {
    id: 'amount',
    label: 'Amount field',
    options: {
      'css-id': { code: "locator('#\\\\:r1\\\\:')", breaks: ['redesign', 'data'], why: 'React generates this id. It changes whenever the component tree does, even between page loads.' },
      'css-class': { code: "locator('.amount input')", breaks: [], why: 'Holds this time: the amount component kept its class. Classes are styling, though; the next restyle may not.' },
      xpath: { code: "locator('//form/div[2]/div/input')", breaks: ['redesign'], why: 'The amount field moved to the top of a new wrapper.' },
      role: { code: "getByRole('textbox', { name: 'Amount' })", breaks: [] },
      label: { code: "getByLabel('Amount')", breaks: [] },
    },
  },
  {
    id: 'send',
    label: 'Send button',
    options: {
      'css-class': { code: "locator('.sl-btn--primary')", breaks: [], why: 'Holds, until a second primary button appears on the page.' },
      xpath: { code: "locator('//form/button')", breaks: ['redesign'], why: 'The button is now inside a row div, not directly in the form.' },
      text: { code: "getByText('Send', { exact: true })", breaks: ['redesign'], why: 'The button now says "Send money".' },
      role: { code: "getByRole('button', { name: 'Send' })", breaks: [], why: 'Name matching is a case-insensitive substring by default, so "Send money" still matches.' },
      testid: { code: "getByTestId('send-button')", breaks: [] },
    },
  },
  {
    id: 'balance',
    label: 'Balance',
    options: {
      'css-class': { code: "locator('.balance .big')", breaks: [] },
      xpath: { code: "locator('//main/section[1]/p[2]')", breaks: [] },
      text: { code: "getByText('₦600,000')", breaks: ['data'], why: 'Finding an element by the value you want to check breaks as soon as the value changes, and can never catch a wrong value.' },
      testid: { code: "getByTestId('balance')", breaks: [] },
    },
  },
];

export const RECOMMENDED: Record<LocatorKind, number> = { role: 0, label: 1, testid: 2, text: 3, 'css-class': 4, xpath: 5, 'css-id': 6 };

export type LocatorChoices = Partial<Record<PageElementId, LocatorKind>>;
export type LocatorResult = { id: PageElementId; kind: LocatorKind | null; code: string | null; holds: boolean; why?: string };

export function runLocators(choices: LocatorChoices, changes: readonly PageChange[]) {
  const results: LocatorResult[] = PAGE_ELEMENTS.map((el) => {
    const kind = choices[el.id] ?? null;
    const opt = kind ? el.options[kind] : undefined;
    if (!kind || !opt) return { id: el.id, kind, code: null, holds: false };
    const broken = opt.breaks.some((b) => changes.includes(b));
    return { id: el.id, kind, code: opt.code, holds: !broken, why: broken ? opt.why : undefined };
  });
  const chosen = results.filter((r) => r.code);
  return { results, metrics: { chosen: chosen.length, elements: results.length, holding: chosen.filter((r) => r.holds).length, broken: chosen.filter((r) => !r.holds).length } };
}
export type LocatorRun = ReturnType<typeof runLocators>;

/** Structure: how many places must change after a redesign, with and without a page object. */
export function placesToFix(choices: LocatorChoices, changes: readonly PageChange[], tests: number, pageObject: boolean) {
  const broken = runLocators(choices, changes).results.filter((r) => r.code && !r.holds).length;
  return pageObject ? broken : broken * tests;
}

/** A recorded trace of one failing test: frames with page state and network calls. */
export type TraceFrame = {
  id: string;
  action: string;
  page: { balance: string; status?: string; screen: 'login' | 'home' };
  network: { method: string; path: string; status: number; body: string }[];
  failed?: boolean;
};

export const STALE_BALANCE_TRACE: TraceFrame[] = [
  { id: 'goto', action: "page.goto('/')", page: { balance: '', screen: 'login' }, network: [{ method: 'GET', path: '/api/me', status: 401, body: '{"error":"UNAUTHENTICATED"}' }] },
  { id: 'login', action: "click Log in", page: { balance: '₦600,000', screen: 'home' }, network: [{ method: 'POST', path: '/api/sessions', status: 201, body: '{"name":"Ada"}' }, { method: 'GET', path: '/api/me', status: 200, body: '{"balance":600000}' }] },
  { id: 'fill', action: "fill Recipient, Amount 5,000", page: { balance: '₦600,000', screen: 'home' }, network: [] },
  { id: 'send', action: "click Send", page: { balance: '₦600,000', status: 'Sent ₦5,000 to tunde@kudi.test (fee ₦0)', screen: 'home' }, network: [{ method: 'POST', path: '/api/transfers', status: 201, body: '{"id":1,"balance":595000}' }] },
  { id: 'refresh', action: "(app refreshes)", page: { balance: '₦600,000', status: 'Sent ₦5,000 to tunde@kudi.test (fee ₦0)', screen: 'home' }, network: [{ method: 'GET', path: '/api/me', status: 200, body: '{"balance":600000}' }, { method: 'GET', path: '/api/transfers', status: 200, body: '[{"id":1,"amount":5000}]' }] },
  { id: 'expect', action: "expect(balance).toHaveText('₦595,000')", page: { balance: '₦600,000', status: 'Sent ₦5,000 to tunde@kudi.test (fee ₦0)', screen: 'home' }, network: [], failed: true },
];
/** The first frame where something is wrong: the API says 595,000 on POST, then 600,000 on GET. */
export const STALE_BALANCE_CULPRIT = 'refresh';
