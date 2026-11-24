import type { Lesson } from '../types';

const OFAT = ['basic-low-standard', 'plus-low-standard', 'basic-high-standard', 'basic-low-express'] as const;
const ONE_PER_RULE = ['plus-low-standard', 'plus-low-express', 'basic-low-standard', 'basic-high-standard', 'basic-low-express'] as const;

export const decisionTables: Lesson = {
  id: 'decision-tables',
  module: 2,
  order: 2,
  title: 'Decision tables',
  hook: 'Every rule works on its own. Put two together and a customer pays double. Which combination did nobody try?',
  minutes: 15,
  level: 'Beginner',
  ctfl: ['FL-4.2.3'],
  scene: 'fees',
  exercise: 'exercises/03-decision-tables',
  learn: [
    { text: 'Spot when inputs interact and one-at-a-time testing fails', afterStep: 1 },
    { text: 'Build a full decision table of every combination', afterStep: 2 },
    { text: 'Collapse the table with "doesn\'t matter" cells', afterStep: 5 },
    { text: 'Trace a wrong cell to the order of the rules', afterStep: 6 },
    { text: 'Drive tests straight from the table', afterStep: 7 },
  ],
  steps: [
    {
      id: 'one-fee',
      role: 'setup',
      rail: 'One fee',
      title: 'Three switches, one fee',
      body: [
        'Kudi now charges a transfer fee. It depends on three things: your tier (Basic or Plus), the amount (up to ₦5,000 or more), and whether you pay for express delivery.',
        'Each switch is a **condition**. The fee is the **action**. Flip the switches under the scene and watch the fee engine answer.',
      ],
      callout: { kind: 'key', text: 'When several inputs together decide one outcome, you are looking at a [[decision-table|decision table]], whether or not anyone wrote it down.' },
      changed: ['1 test: Basic, ₦2,000, standard → ₦10'],
      scene: { kind: 'fees', suite: ['basic-low-standard'], order: 'express-first' },
      deep: {
        title: 'Reading the fee spec',
        blocks: [
          { type: 'diagram', key: 'combo-cube', caption: 'Three yes/no conditions make a 2 × 2 × 2 cube: eight combinations, one small cube each.' },
          { type: 'p', text: 'The spec in `apps/kudi/SPEC.md` lists five rules. Specs are often written like this: as rules, not as combinations. Your job is to turn rules back into combinations, because that is where bugs hide.' },
          { type: 'table', head: ['Rule', 'When', 'Fee'], rows: [['R1', 'Plus, standard', '₦0'], ['R2', 'Plus, express', '₦50'], ['R3', 'Basic, ≤ ₦5,000, standard', '₦10'], ['R4', 'Basic, > ₦5,000, standard', '₦25'], ['R5', 'Basic, express (any amount)', '₦100']] },
        ],
      },
    },
    {
      id: 'one-at-a-time',
      role: 'problem',
      rail: 'One at a time',
      title: 'Change one thing at a time',
      body: [
        'A common habit: start from a baseline and change one condition per test. Basic standard, then switch tier, then switch amount, then switch express.',
        'Four tests, all green. But look at the cube: half of it is still grey.',
      ],
      callout: { kind: 'watch', text: 'Changing one thing at a time never tests two things changing together. Bugs that live in combinations stay hidden.' },
      changed: ['Tests 1 → 4', 'Combinations covered: 4 of 8'],
      scene: { kind: 'fees', suite: OFAT, order: 'express-first' },
      deep: {
        title: 'Why one-factor-at-a-time misses bugs',
        blocks: [
          { type: 'p', text: 'The four tests touch each switch, so it **feels** complete. But Plus and express are never on at the same time. Any rule that depends on both is untested.' },
          { type: 'p', text: 'This is called an **interaction**. In real products they are everywhere: discount codes on sale items, admin users on mobile, an expired card in a foreign currency.' },
        ],
      },
    },
    {
      id: 'full-table',
      role: 'fix',
      rail: 'Full table',
      title: 'Write every combination down',
      body: [
        'A full decision table lists every combination of conditions, one per column, with the expected action for each.',
        'With three yes/no conditions you get 2 × 2 × 2 cells. The grey cubes are the combinations nobody has tested yet.',
      ],
      predict: {
        question: 'How many combinations does the full fee table have?',
        options: [
          { id: '3', label: '3' },
          { id: '6', label: '6' },
          { id: '8', label: '8' },
          { id: '16', label: '16' },
        ],
        answer: '8',
        explain: 'Each condition has 2 values: 2 × 2 × 2 = 8. A fourth yes/no condition would double it to 16, which is why collapsing matters (step 6).',
      },
      changed: ['The cube now shows all 8 cells', '4 still untested'],
      scene: { kind: 'fees', suite: OFAT, order: 'express-first' },
      deep: {
        title: 'Building the table by hand',
        blocks: [
          { type: 'table', head: ['', '1', '2', '3', '4', '5', '6', '7', '8'], rows: [['Tier', 'B', 'B', 'B', 'B', 'P', 'P', 'P', 'P'], ['> ₦5,000', 'N', 'N', 'Y', 'Y', 'N', 'N', 'Y', 'Y'], ['Express', 'N', 'Y', 'N', 'Y', 'N', 'Y', 'N', 'Y'], ['Fee', '₦10', '₦100', '₦25', '₦100', '₦0', '₦50', '₦0', '₦50']] },
          { type: 'p', text: 'Fill it in like counting in binary: the last row flips every column, the one above every two, the top every four. You can\'t miss a combination that way.' },
        ],
      },
    },
    {
      id: 'incident',
      role: 'problem',
      rail: 'Production',
      title: 'A Plus customer pays ₦100',
      body: [
        'A Plus customer sends ₦3,000 by express. The spec says ₦50. Kudi charges ₦100.',
        'They pay for Plus to get cheaper fees, and they are being charged like a Basic customer. That is an [[escaped-bug|escaped bug]].',
      ],
      callout: { kind: 'watch', text: 'Every individual switch was tested. The bug only appears when two of them are on together.' },
      changed: ['Escaped bugs 0 → 1'],
      scene: { kind: 'fees', suite: OFAT, order: 'express-first', incident: true },
      goal: { text: 'Reproduce it: set the switches to Plus, any amount, express.', check: { kind: 'fee-fails' } },
      deep: {
        title: 'Severity of a money bug',
        blocks: [
          { type: 'p', text: 'Overcharging is high [[severity]] even for small amounts: it breaks the promise customers pay for, and in many countries it is a regulatory problem. It also scales: every Plus express transfer since release was overcharged.' },
          { type: 'p', text: 'A good defect report here names the exact combination (Plus + express), the expected and actual fee, and that both amount bands are affected.' },
        ],
      },
    },
    {
      id: 'fill-gaps',
      role: 'fix',
      rail: 'Fill the gaps',
      title: 'Test every cell',
      body: ['Run all 8 combinations. Now the cube has no grey left, and a whole slice of it turns red.'],
      predict: {
        question: 'Which cells will fail?',
        options: [
          { id: 'plus-express', label: 'Plus + express, both amounts' },
          { id: 'basic-express', label: 'Basic + express' },
          { id: 'plus-standard', label: 'Plus + standard' },
          { id: 'one', label: 'Only one cell' },
        ],
        answer: 'plus-express',
        explain: 'Both Plus + express cells fail, whatever the amount. When a bug fills a whole slice of the cube, the amount isn\'t part of the cause, which points you at tier and express.',
      },
      changed: ['Tests 4 → 8', 'Combinations covered: 8 of 8', '2 fail'],
      scene: { kind: 'fees', suite: 'all', order: 'express-first', incident: true },
      deep: {
        title: 'Reading the shape of failures',
        blocks: [
          { type: 'diagram', key: 'combo-cube', caption: 'A failing slice, not a single cube: the amount does not matter for this bug.' },
          { type: 'p', text: 'Where the red cubes sit tells you which conditions the bug depends on. One red cube: all three matter. A red slice: two matter. A red half: one matters. That is a debugging clue you get for free from a full table.' },
        ],
      },
    },
    {
      id: 'collapse',
      role: 'fix',
      rail: 'Collapse',
      title: 'Five rules, not eight cells',
      body: [
        'For express transfers, the amount doesn\'t change the fee. Those cells can merge: "amount: doesn\'t matter". Eight cells collapse into the five rules from the spec.',
        'One test per rule still catches the bug, with three fewer tests.',
      ],
      callout: { kind: 'key', text: 'Collapse a decision table only where the spec says a condition doesn\'t matter, never because it is inconvenient. Each collapsed column still needs one test.' },
      changed: ['Tests 8 → 5', 'Rules covered: 5 of 5', 'Still 1 failure'],
      scene: { kind: 'fees', suite: ONE_PER_RULE, order: 'express-first', incident: true, collapsed: true },
      deep: {
        title: 'When collapsing goes wrong',
        blocks: [
          { type: 'diagram', key: 'collapse', caption: 'Two cells become one rule when the spec says the merged condition doesn\'t matter.' },
          { type: 'p', text: 'Collapsing assumes the code agrees with the spec about which conditions don\'t matter. If you suspect it doesn\'t, test the full table. With 3 conditions that\'s cheap; with 6 (64 cells) you collapse and add a few risky combinations by hand.' },
          { type: 'p', text: 'For many conditions, **pairwise testing** covers every pair of values in far fewer tests. It is beyond the CTFL syllabus but worth knowing exists.' },
        ],
      },
    },
    {
      id: 'root-cause',
      role: 'fix',
      rail: 'Root cause',
      title: 'Rules in the wrong order',
      body: ['The code checks express before it checks the tier, so the Basic express fee wins for everyone.'],
      code: "// fees.ts\nif (express) return 100;          // runs first\nif (tier === 'plus') return 0;\nreturn amount > 5000 ? 25 : 10;",
      after: 'Use the rule-order switch to check tier first, then rerun all 8 cells.',
      callout: { kind: 'key', text: 'Overlapping rules plus an `if` chain is a classic source of decision-table bugs: the first matching branch wins, whether or not it should.' },
      changed: ['Tier checked first', 'All 8 cells pass', 'Escaped bugs 1 → 0'],
      scene: { kind: 'fees', suite: 'all', order: 'learner', incident: true },
      goal: { text: 'Switch the rule order so every cell in the cube passes.', check: { kind: 'all-pass' } },
      deep: {
        title: 'Make the code look like the table',
        blocks: [
          { type: 'p', text: 'The safest fix is often structural: write the fee as a lookup over the table itself, so the code and the spec have the same shape and order can\'t matter.' },
          { type: 'code', code: "const FEES = {\n  plus:  { standard: () => 0, express: () => 50 },\n  basic: { standard: (a) => (a > 5000 ? 25 : 10), express: () => 100 },\n};\nconst fee = FEES[tier][express ? 'express' : 'standard'](amount);" },
        ],
      },
    },
    {
      id: 'automate',
      role: 'fix',
      rail: 'Automate',
      title: 'The table is the test',
      body: ['Copy the table into the test file. Each column becomes one row of cases.'],
      code: "const table = [\n  // tier,    amount, express, fee\n  ['basic',   2000, false,  10],\n  ['basic',   8000, false,  25],\n  ['basic',   2000, true,  100],\n  ['plus',    2000, false,   0],\n  ['plus',    2000, true,   50],\n] as const;\n\nfor (const [tier, amount, express, fee] of table) {\n  test(`${tier} ₦${amount} express=${express} → ₦${fee}`, async ({ request }) => {\n    await logInAs(request, tier);\n    const res = await request.get(`/api/fees?amount=${amount}&express=${express}`);\n    expect(await res.json()).toEqual({ fee });\n  });\n}",
      after: 'A reviewer can check this test against the spec line by line. You will write it in the Practice exercise.',
      changed: ['5 rules, 5 rows, 1 test', 'Runs in CI on every pull request'],
      scene: { kind: 'fees', suite: ONE_PER_RULE, order: 'tier-first', incident: true, collapsed: true, ci: true },
      deep: {
        title: 'Test level for a fee',
        blocks: [
          { type: 'diagram', key: 'pyramid', caption: 'The fee is pure logic: test the table at unit and API level, check the UI shows it once.' },
          { type: 'p', text: 'Fee rules rarely need a browser. The API test above runs all rules in under a second; one UI test confirms the fee appears on the confirm screen.' },
        ],
      },
    },
    {
      id: 'recap',
      role: 'recap',
      rail: 'Recap',
      title: 'What you can do now',
      body: ['When several inputs decide one result:'],
      list: ['List the conditions and their values', 'Write every combination as a column', 'Fill in the expected action from the spec', 'Collapse only where the spec says "doesn\'t matter"', 'Turn each column into a row of test cases'],
      after: 'Next: state transitions, for when the order of actions matters.',
      changed: [],
      scene: { kind: 'fees', suite: 'all', order: 'tier-first', incident: true, ci: true },
      deep: {
        title: 'Spot decision tables in your product',
        blocks: [
          { type: 'p', text: 'Look for words like "if", "unless", "only when", "except" in specs and tickets. Each one is a condition. Two or more together is a table waiting to be written.' },
        ],
      },
    },
  ],
  check: [
    {
      q: 'A discount applies to members, on weekends, for orders over ₦10,000. How many combinations are in the full table?',
      options: ['3', '6', '8', '9'],
      answer: 2,
      why: 'Three yes/no conditions: 2 × 2 × 2 = 8.',
    },
    {
      q: 'You tested each condition once, changing one at a time. All passed. What could still be broken?',
      options: ['Nothing', 'Any rule that depends on two conditions at once', 'Only the UI', 'Only invalid inputs'],
      answer: 1,
      why: 'One-at-a-time never turns two conditions on together, so interaction rules are untested.',
    },
    {
      q: 'When may you merge two columns into one "doesn\'t matter" column?',
      options: ['When you are short of time', 'When the spec says that condition doesn\'t change the result there', 'When both columns passed last time', 'Never'],
      answer: 1,
      why: 'Collapsing follows the spec. If the spec doesn\'t say a condition is irrelevant, keep both columns.',
    },
  ],
  atWork: [
    'Find a feature with "if", "unless" or "only when" in its spec or ticket.',
    'List its conditions and how many values each has.',
    'Write the full table in the ticket, even as a quick grid.',
    'Ask the product owner to fill any cell the spec doesn\'t cover.',
    'Test every column, then automate the table as data.',
  ],
};
