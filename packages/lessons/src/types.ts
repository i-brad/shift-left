/** Lessons are data. The site's lesson player renders any lesson that matches these types. */

export type StepRole = 'setup' | 'problem' | 'fix' | 'recap';
export type CalloutKind = 'key' | 'watch' | 'try';

/** Inline text supports **bold**, `code` and [[glossary-key]] or [[glossary-key|shown words]]. */
export type DeepBlock =
  | { type: 'h'; text: string }
  | { type: 'p'; text: string }
  | { type: 'table'; head: string[]; rows: string[][] }
  | { type: 'code'; code: string; note?: string }
  | { type: 'diagram'; key: DiagramKey; caption: string };

export type DiagramKey =
  | 'oracle' | 'random-cost' | 'partitions' | 'three-value' | 'triage' | 'pyramid' | 'recap'
  | 'combo-cube' | 'collapse' | 'state-map' | 'transition-coverage';

/** Declarative, so goals can be checked by the player and by tests. */
export type GoalCheck =
  | { kind: 'probe-fails'; amount: number }
  | { kind: 'all-pass' }
  | { kind: 'fee-fails' }
  | { kind: 'card-wrong'; id: string };

export type BoundaryScene = {
  kind: 'boundaries';
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

export type FeeScene = {
  kind: 'fees';
  /** Combination ids in the suite (e.g. 'plus-low-express'), or 'all'. */
  suite: readonly string[] | 'all';
  /** Rule order in the code. 'learner' = learner switches it, starting buggy. */
  order: 'express-first' | 'tier-first' | 'learner';
  /** Show the 5 collapsed rules instead of 8 cells. */
  collapsed?: boolean;
  incident?: boolean;
  ci?: boolean;
};

export type CardScene = {
  kind: 'card';
  /** Transition ids in the suite (e.g. 'active:freeze'), or 'valid' / 'all'. */
  suite: readonly string[] | 'valid' | 'all';
  bug: boolean | 'learner';
  /** Show the refusals (invalid transitions) on the map, tested or not. */
  refusals?: boolean;
  incident?: boolean;
  ci?: boolean;
};

export type SceneState = BoundaryScene | FeeScene | CardScene;
export type SceneKind = SceneState['kind'];

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
  /** Ask the learner to predict before the scene shows results. Answering unlocks Next. */
  predict?: Prediction;
  deep: { title: string; blocks: DeepBlock[] };
};

export type Prediction = {
  question: string;
  options: { id: string; label: string }[];
  answer: string;
  /** Shown after answering, right or wrong. */
  explain: string;
};

export type CheckQuestion = {
  q: string;
  options: string[];
  /** Index into options. */
  answer: number;
  why: string;
};

export type GlossaryEntry = { term: string; def: string };

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
  scene: SceneKind;
  learn: { text: string; afterStep: number }[];
  steps: Step[];
  exercise?: string;
  /** End-of-lesson questions. */
  check: CheckQuestion[];
  /** How to use this on a real product team tomorrow. */
  atWork: string[];
};

export type CourseLesson = { id: string; title: string; ctfl?: string[]; built: boolean };
export type CourseModule = { n: number; title: string; color: string; optional?: boolean; lessons: CourseLesson[] };
