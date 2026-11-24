/**
 * Planted bugs. Each one is off by default and switched on by name:
 *
 *   KUDI_BUGS=limit-exclusive pnpm kudi
 *
 * Exercises turn on their bug, so the learner's test can be seen to fail, then pass once it's off.
 */
export const BUGS = {
  'limit-exclusive': {
    lesson: 'partitions-boundaries',
    summary: 'The maximum transfer uses < instead of <=, so exactly ₦500,000 is rejected.',
  },
  'fee-express-first': {
    lesson: 'decision-tables',
    summary: 'The fee rules check express before tier, so Plus customers pay the Basic express fee (₦100 instead of ₦50).',
  },
  'card-unblock': {
    lesson: 'state-transitions',
    summary: 'Unfreeze only checks "not active", so a blocked card can be reactivated.',
  },
} as const;

export type BugName = keyof typeof BUGS;

export function parseBugs(raw: string | undefined): Set<BugName> {
  const names = (raw ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const unknown = names.filter((n) => !(n in BUGS));
  if (unknown.length) throw new Error(`Unknown KUDI_BUGS: ${unknown.join(', ')}. Known: ${Object.keys(BUGS).join(', ')}`);
  return new Set(names as BugName[]);
}

export type Bugs = { on: (name: BugName) => boolean; list: BugName[] };

export function bugsFrom(active: Iterable<BugName>): Bugs {
  const set = new Set(active);
  return { on: (n) => set.has(n), list: [...set] };
}

export const noBugs: Bugs = bugsFrom([]);
