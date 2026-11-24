/** Design tokens. Every colour means one thing — see docs: "Design system". */
export const color = {
  paper: '#F4EFE6',
  card: '#FBF8F2',
  ink: '#1F1E1B',
  mute: '#6F685C',
  soft: '#E3DCCF',
  grid: '#E8E0D2',
  /** Your actions: your tests, selection, primary buttons. */
  lavender: '#E6DDFA',
  lavenderDeep: '#CDBFF3',
  /** The system under test, valid zones. */
  sky: '#D9E7FB',
  /** Passed. */
  sage: '#DCEFD0',
  /** Failed, broken, escaped. */
  rose: '#F9D6D6',
  roseInk: '#8F1D17',
  /** Should be rejected. */
  pink: '#FBE0E5',
  /** Time, cost, hints. */
  butter: '#FBE8B8',
  /** Requests in flight. */
  request: '#EF9F55',
} as const;

export type Tone = 'neutral' | 'good' | 'bad' | 'you' | 'system' | 'hint';

export const toneFill: Record<Tone, string> = {
  neutral: color.card,
  good: color.sage,
  bad: color.rose,
  you: color.lavender,
  system: color.sky,
  hint: color.butter,
};
