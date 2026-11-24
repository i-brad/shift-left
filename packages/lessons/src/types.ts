/** Lessons are data. The site's lesson player renders any lesson that matches these types. */

export type StepRole = 'setup' | 'problem' | 'fix' | 'recap';
export type CalloutKind = 'key' | 'watch' | 'try';

/** Inline text supports **bold** and `code`. */
export type DeepBlock =
  | { type: 'h'; text: string }
  | { type: 'p'; text: string }
  | { type: 'table'; head: string[]; rows: string[][] }
  | { type: 'code'; code: string; note?: string }
  | { type: 'diagram'; key: DiagramKey; caption: string };

export type DiagramKey = 'oracle' | 'random-cost' | 'partitions' | 'three-value' | 'triage' | 'pyramid' | 'recap';

/** Declarative, so goals can be checked by the player and by tests. */
export type GoalCheck =
  | { kind: 'probe-fails'; amount: number }
  | { kind: 'all-pass' };

export type SceneState = {
  /** Amounts in the test suite, or a count of random amounts. */
  suite: readonly number[] | { random: number };
  zones?: boolean;
  /** A customer has hit the bug in production. */
  incident?: boolean;
  /** Suite runs in CI on every pull request. */
  ci?: boolean;
  /** Validator operator at the maximum. 'learner' = the learner controls it, starting at '<'. */
  operator: '<' | '<=' | 'learner';
};

export type Step = {
  id: string;
  role: StepRole;
  rail: string;
  title: string;
  body: string[];
  list?: string[];
  code?: string;
  after?: string;
  callout?: { kind: CalloutKind; text: string };
  changed: string[];
  scene: SceneState;
  goal?: { text: string; check: GoalCheck };
  deep: { title: string; blocks: DeepBlock[] };
};

export type Lesson = {
  id: string;
  module: number;
  order: number;
  title: string;
  hook: string;
  minutes: number;
  level: 'Beginner' | 'Intermediate';
  /** ISTQB CTFL v4.0 learning objectives, e.g. FL-4.2.2. */
  ctfl: string[];
  scene: 'boundaries';
  learn: { text: string; afterStep: number }[];
  steps: Step[];
  exercise?: string;
};

export type CourseLesson = { id: string; title: string; ctfl?: string[]; built: boolean };
export type CourseModule = { n: number; title: string; color: string; optional?: boolean; lessons: CourseLesson[] };
