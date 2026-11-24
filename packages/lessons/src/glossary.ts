import type { GlossaryEntry } from './types';

/** Plain-language definitions. Lesson text links to these with [[key]]. */
export const glossary: Record<string, GlossaryEntry> = {
  spec: { term: 'Spec', def: 'The written description of how a feature should behave. Your tests check the app against it.' },
  oracle: { term: 'Test oracle', def: 'Whatever tells you the right answer for a test: the spec, a product owner, a previous version, or common sense.' },
  'test-case': { term: 'Test case', def: 'One input plus the result you expect. "Send ₦5,000 → accepted" is a test case.' },
  coverage: { term: 'Coverage', def: 'How much of the possible behaviour your tests actually exercise. Many tests can still have poor coverage.' },
  partition: { term: 'Equivalence partition', def: 'A group of inputs the app should treat the same way, like "every amount from ₦100 to ₦500,000". Testing one value stands in for the group.' },
  boundary: { term: 'Boundary value', def: 'A value on the edge of a partition, or just past it. ₦500,000 and ₦500,001 are the boundary values at the maximum.' },
  'off-by-one': { term: 'Off-by-one error', def: 'A bug where code is wrong by exactly one step at an edge, often < written where <= was meant.' },
  defect: { term: 'Defect (bug)', def: 'A flaw in the product that makes it behave differently from the spec.' },
  severity: { term: 'Severity', def: 'How much damage a bug does. A crash on payment is high severity; a typo is low.' },
  priority: { term: 'Priority', def: 'How soon a bug should be fixed. Usually set by the team, not only by severity.' },
  regression: { term: 'Regression test', def: 'A test you keep running so a bug that was fixed can never quietly come back.' },
  'test-level': { term: 'Test level', def: 'Where a test runs: unit (one function), API (one endpoint), or UI/end-to-end (the whole app in a browser).' },
  'escaped-bug': { term: 'Escaped bug', def: 'A bug that got past every test and was found by a user in production.' },
  'decision-table': { term: 'Decision table', def: 'A grid listing every combination of conditions and the result each should give. Used when several inputs decide one outcome together.' },
  state: { term: 'State', def: 'The condition something is in right now, like a card being active, frozen or blocked. What an action does depends on it.' },
  'state-transition': { term: 'State transition', def: 'A move from one state to another caused by an action, like freeze taking a card from active to frozen.' },
  'valid-transition': { term: 'Valid transition', def: 'A move the spec allows. Tests check it happens and lands in the right state.' },
  'invalid-transition': { term: 'Invalid transition', def: 'A move the spec forbids. Tests check the system refuses it and the state does not change.' },
};
