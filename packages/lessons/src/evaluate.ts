import {
  ALL_COMBOS,
  ALL_TRANSITIONS,
  BAND_AMOUNT,
  DEFAULT_MODEL,
  VALID_TRANSITIONS,
  bandOf,
  codeFee,
  codeNext,
  comboId,
  probe,
  randomAmounts,
  ruleOf,
  run,
  runCard,
  runBoard,
  runCoverage,
  runPipeline,
  runLocators,
  placesToFix,
  runTiming,
  runSuite,
  runLoad,
  LOAD_STEPS,
  type LoadResult,
  STALE_BALANCE_TRACE,
  type LocatorChoices,
  type LocatorRun,
  type PageChange,
  type TraceFrame,
  type TimingResult,
  type WaitStrategy,
  type SuiteDef,
  type SuiteOptions,
  type SuiteResult,
  exchange,
  bugShown,
  failingAssertions,
  runFees,
  specFee,
  specNext,
  transitionId,
  type BoundaryModel,
  type BoundaryRun,
  type CardRun,
  type BoardDef,
  type BoardPicks,
  type BoardRun,
  type CovTest,
  type CoverageRun,
  type PipelineDef,
  type PipelineRun,
  type ApiRequest,
  type Assertion,
  type Exchange,
  type CardState,
  type FeeCombo,
  type FeeOrder,
  type FeeRun,
  type MaxOperator,
  type ProbeResult,
  type Tier,
  type Transition,
} from '@shift-left/sim';
import type { LoadScene, BoardScene, BoundaryScene, CardScene, CoverageScene, FeeScene, GoalCheck, Lesson, PageScene, PipelineScene, RequestScene, Step, SuiteScene, TimingScene } from './types';

/** Everything the learner has done in the lesson. One shape for all scenes; each scene reads its part. */
export type Learner = {
  operator: MaxOperator;
  probe: number | null;
  fee: { tier: Tier; amount: number; express: boolean };
  feeOrder: FeeOrder;
  card: { state: CardState; tried: Transition[] };
  cardFixed: boolean;
  board: Record<string, BoardPicks>;
  boardChecked: Record<string, boolean>;
  covTests: CovTest[];
  covFixed: boolean;
  /** pipelineId → enabled checks (only once the learner has touched it). */
  pipes: Record<string, string[]>;
  /** The request being edited (null = use the step's preset), requests sent, and chosen assertions. */
  req: ApiRequest | null;
  sent: ApiRequest[];
  assertions: Assertion[];
  locators: LocatorChoices;
  pageChanges: PageChange[];
  pageObject: boolean;
  traceFrame: string | null;
  timing: { latency: number; strategy: WaitStrategy; sleepMs: number };
  /** suiteId → options the learner changed. */
  suites: Record<string, Partial<SuiteOptions>>;
  load: { users: number; servers: number; marked: number | null };
};

export const initialLearner = (): Learner => ({
  operator: '<',
  probe: null,
  fee: { tier: 'basic', amount: 2000, express: false },
  feeOrder: 'express-first',
  card: { state: 'active', tried: [] },
  cardFixed: false,
  board: {},
  boardChecked: {},
  covTests: [],
  covFixed: false,
  pipes: {},
  req: null,
  sent: [],
  assertions: ['status'],
  locators: {},
  pageChanges: [],
  pageObject: false,
  traceFrame: null,
  timing: { latency: 800, strategy: 'sleep', sleepMs: 1000 },
  suites: {},
  load: { users: 10, servers: 1, marked: null },
});

export type BoundaryEval = {
  kind: 'boundaries';
  model: BoundaryModel;
  suite: number[];
  isRandom: boolean;
  run: BoundaryRun;
  you: ProbeResult | null;
  escapedBugs: number;
  goalMet: boolean;
};

export type FeeEval = {
  kind: 'fees';
  order: FeeOrder;
  run: FeeRun;
  you: { combo: FeeCombo; id: string; expected: number; actual: number; passed: boolean };
  escapedBugs: number;
  goalMet: boolean;
};

export type CardEval = {
  kind: 'card';
  bug: boolean;
  run: CardRun;
  /** The learner's own attempts, with results. */
  tried: (Transition & { id: string; expected: CardState | null; actual: CardState | null; passed: boolean })[];
  state: CardState;
  escapedBugs: number;
  goalMet: boolean;
};

export type BoardEval = { kind: 'board'; boardId: string; def: BoardDef; run: BoardRun; checked: boolean; escapedBugs: number; goalMet: boolean };

export type CoverageEval = { kind: 'coverage'; fixed: boolean; run: CoverageRun; escapedBugs: number; goalMet: boolean };

export type PipelineEval = { kind: 'pipeline'; pipelineId: string; def: PipelineDef; enabled: string[]; learnerControls: boolean; run: PipelineRun; escapedBugs: number; goalMet: boolean };

export type RequestEval = { kind: 'request'; req: ApiRequest; current: Exchange; history: Exchange[]; assertions: Assertion[]; catching: Assertion[]; escapedBugs: number; goalMet: boolean };

export type PageEval =
  | { kind: 'page'; mode: 'locators'; changes: PageChange[]; learnerChanges: boolean; choices: LocatorChoices; run: LocatorRun; structure?: { tests: number; pageObject: boolean; learnerPO: boolean; places: number }; escapedBugs: number; goalMet: boolean }
  | { kind: 'page'; mode: 'trace'; frames: TraceFrame[]; frame: string | null; escapedBugs: number; goalMet: boolean };

export type TimingEval = { kind: 'timing'; latency: number; strategy: WaitStrategy; sleepMs: number; learnerLatency: boolean; learnerStrategy: boolean; result: TimingResult; escapedBugs: number; goalMet: boolean };

export type SuiteEval = { kind: 'suite'; suiteId: string; def: SuiteDef; options: SuiteOptions; controls: (keyof SuiteOptions)[]; result: SuiteResult; escapedBugs: number; goalMet: boolean };

export type LoadEval = { kind: 'load'; users: number; servers: number; thresholdMs: number; learnerUsers: boolean; learnerServers: boolean; current: LoadResult; sweep: LoadResult[]; limit: number; marked: number | null; escapedBugs: number; goalMet: boolean };

export type StepEval = LoadEval | BoundaryEval | FeeEval | CardEval | BoardEval | CoverageEval | PipelineEval | RequestEval | PageEval | TimingEval | SuiteEval;

export function evaluateStep(step: Step, learner: Learner, lesson?: Pick<Lesson, 'boards' | 'pipelines' | 'suites'>): StepEval {
  switch (step.scene.kind) {
    case 'load':
      return evalLoad(step, step.scene, learner);
    case 'page':
      return evalPage(step, step.scene, learner);
    case 'timing':
      return evalTiming(step, step.scene, learner);
    case 'suite':
      return evalSuite(step, step.scene, learner, lesson);
    case 'pipeline':
      return evalPipeline(step, step.scene, learner, lesson);
    case 'request':
      return evalRequest(step, step.scene, learner);
    case 'board':
      return evalBoard(step, step.scene, learner, lesson);
    case 'coverage':
      return evalCoverage(step, step.scene, learner);
    case 'boundaries':
      return evalBoundaries(step, step.scene, learner);
    case 'fees':
      return evalFees(step, step.scene, learner);
    case 'card':
      return evalCard(step, step.scene, learner);
  }
}

function evalBoundaries(step: Step, scene: BoundaryScene, learner: Learner): BoundaryEval {
  const operator = scene.operator === 'learner' ? learner.operator : scene.operator;
  const model: BoundaryModel = { ...DEFAULT_MODEL, maxOperator: operator };
  const isRandom = !Array.isArray(scene.suite);
  const suite = Array.isArray(scene.suite) ? [...(scene.suite as readonly number[])] : randomAmounts((scene.suite as { random: number }).random);
  const result = run(model, suite);
  const you = learner.probe == null ? null : probe(model, learner.probe);
  const escapedBugs = scene.incident && operator === '<' ? 1 : 0;
  const goalMet = !step.goal || checkGoal(step.goal.check, { allPass: result.metrics.failing === 0, probe: you });
  return { kind: 'boundaries', model, suite, isRandom, run: result, you, escapedBugs, goalMet };
}

function evalFees(step: Step, scene: FeeScene, learner: Learner): FeeEval {
  const order = scene.order === 'learner' ? learner.feeOrder : scene.order;
  const combos = scene.suite === 'all' ? ALL_COMBOS : ALL_COMBOS.filter((c) => (scene.suite as readonly string[]).includes(comboId(c)));
  const result = runFees({ order }, combos);
  const combo: FeeCombo = { tier: learner.fee.tier, band: bandOf(learner.fee.amount), express: learner.fee.express };
  const expected = specFee(combo);
  const actual = codeFee({ order }, combo);
  const you = { combo, id: comboId(combo), expected, actual, passed: expected === actual };
  const escapedBugs = scene.incident && order === 'express-first' ? 1 : 0;
  const goalMet = !step.goal || checkGoal(step.goal.check, { allPass: result.metrics.failing === 0, feeYouFails: !you.passed });
  return { kind: 'fees', order, run: result, you, escapedBugs, goalMet };
}

function evalCard(step: Step, scene: CardScene, learner: Learner): CardEval {
  const bug = scene.bug === 'learner' ? !learner.cardFixed : scene.bug;
  const ts = scene.suite === 'all' ? ALL_TRANSITIONS : scene.suite === 'valid' ? VALID_TRANSITIONS : ALL_TRANSITIONS.filter((t) => (scene.suite as readonly string[]).includes(transitionId(t)));
  const result = runCard({ bug }, ts);
  const tried = learner.card.tried.map((t) => {
    const expected = specNext(t);
    const actual = codeNext({ bug }, t);
    return { ...t, id: transitionId(t), expected, actual, passed: expected === actual };
  });
  const escapedBugs = scene.incident && bug ? 1 : 0;
  const goalMet = !step.goal || checkGoal(step.goal.check, { allPass: result.metrics.failing === 0, cardWrong: new Set(tried.filter((t) => !t.passed).map((t) => t.id)) });
  return { kind: 'card', bug, run: result, tried, state: learner.card.state, escapedBugs, goalMet };
}

function evalBoard(step: Step, scene: BoardScene, learner: Learner, lesson?: Pick<Lesson, 'boards'>): BoardEval {
  const def = lesson?.boards?.[scene.board];
  if (!def) throw new Error(`Unknown board "${scene.board}"`);
  const result = runBoard(def, learner.board[scene.board] ?? {});
  const checked = !!scene.reveal || !!learner.boardChecked[scene.board];
  const goalMet = !step.goal || checkGoal(step.goal.check, { allPass: result.metrics.complete, boardDone: { [scene.board]: checked && result.metrics.complete } });
  return { kind: 'board', boardId: scene.board, def, run: result, checked, escapedBugs: 0, goalMet };
}

function evalCoverage(step: Step, scene: CoverageScene, learner: Learner): CoverageEval {
  const fixed = scene.fixed === 'learner' ? learner.covFixed : scene.fixed;
  const tests = [...scene.suite, ...(scene.learnerTests ? learner.covTests : [])];
  const result = runCoverage(tests, fixed);
  const escapedBugs = scene.incident && !fixed ? 1 : 0;
  const goalMet = !step.goal || checkGoal(step.goal.check, { allPass: result.metrics.failing === 0, covFails: result.metrics.failing > 0 });
  return { kind: 'coverage', fixed, run: result, escapedBugs, goalMet };
}

function evalPipeline(step: Step, scene: PipelineScene, learner: Learner, lesson?: Pick<Lesson, 'pipelines'>): PipelineEval {
  const def = lesson?.pipelines?.[scene.pipeline];
  if (!def) throw new Error(`Unknown pipeline "${scene.pipeline}"`);
  const learnerControls = scene.enabled === 'learner';
  const enabled = learnerControls ? (learner.pipes[scene.pipeline] ?? [...(scene.start ?? [])]) : [...(scene.enabled as readonly string[])];
  const result = runPipeline(def, enabled);
  const goalMet = !step.goal || checkGoal(step.goal.check, { allPass: result.metrics.escaped === 0, pipeline: { id: scene.pipeline, m: result.metrics } });
  return { kind: 'pipeline', pipelineId: scene.pipeline, def, enabled, learnerControls, run: result, escapedBugs: result.metrics.escaped, goalMet };
}

function evalRequest(step: Step, scene: RequestScene, learner: Learner): RequestEval {
  const bugs = new Set(scene.bugs);
  const req = learner.req ?? scene.preset;
  const current = exchange(req, bugs);
  const history = learner.sent.map((r) => exchange(r, bugs));
  const failing = failingAssertions(current);
  const catching = learner.assertions.filter((a) => failing.includes(a));
  const goalMet =
    !step.goal ||
    checkGoal(step.goal.check, {
      allPass: false,
      request: { statuses: new Set(history.map((h) => h.actual.status)), found: new Set(history.map(bugShown).filter(Boolean) as string[]), catches: !current.matches && catching.length > 0 },
    });
  return { kind: 'request', req, current, history, assertions: learner.assertions, catching, escapedBugs: 0, goalMet };
}

/** The most users (from LOAD_STEPS) that still meet the threshold with this many servers; 0 if none. */
export function loadLimit(servers: number, thresholdMs: number) {
  return Math.max(0, ...LOAD_STEPS.filter((u) => runLoad({ users: u, capacity: 100 * servers, thresholdMs }).passed));
}

function evalLoad(step: Step, scene: LoadScene, learner: Learner): LoadEval {
  const learnerUsers = scene.users === 'learner';
  const learnerServers = scene.servers === 'learner';
  const users = learnerUsers ? learner.load.users : (scene.users as number);
  const servers = learnerServers ? learner.load.servers : (scene.servers as number);
  const capacity = 100 * servers;
  const current = runLoad({ users, capacity, thresholdMs: scene.thresholdMs });
  const sweep = LOAD_STEPS.map((u) => runLoad({ users: u, capacity, thresholdMs: scene.thresholdMs }));
  const limit = loadLimit(servers, scene.thresholdMs);
  const check = step.goal?.check;
  let goalMet = true;
  if (check?.kind === 'load-limit') goalMet = learner.load.marked === limit;
  else if (check?.kind === 'load-target') goalMet = servers <= check.maxServers && runLoad({ users: check.users, capacity, thresholdMs: scene.thresholdMs }).passed;
  else if (step.goal) goalMet = checkGoal(step.goal.check, { allPass: current.passed });
  return { kind: 'load', users, servers, thresholdMs: scene.thresholdMs, learnerUsers, learnerServers, current, sweep, limit, marked: learner.load.marked, escapedBugs: 0, goalMet };
}

function evalPage(step: Step, scene: PageScene, learner: Learner): PageEval {
  if (scene.mode === 'trace') {
    const goalMet = !step.goal || checkGoal(step.goal.check, { allPass: false, traceFrame: learner.traceFrame });
    return { kind: 'page', mode: 'trace', frames: STALE_BALANCE_TRACE, frame: learner.traceFrame, escapedBugs: 0, goalMet };
  }
  const learnerChanges = scene.changes === 'learner';
  const changes = learnerChanges ? learner.pageChanges : [...((scene.changes as readonly PageChange[] | undefined) ?? [])];
  const choices = { ...(scene.preset ?? {}), ...(scene.choose ? learner.locators : {}) };
  const result = runLocators(choices, changes);
  let structure: Extract<PageEval, { mode: 'locators' }>['structure'];
  if (scene.structure) {
    const learnerPO = scene.structure.pageObject === 'learner';
    const pageObject = learnerPO ? learner.pageObject : (scene.structure.pageObject as boolean);
    structure = { tests: scene.structure.tests, pageObject, learnerPO, places: placesToFix(choices, changes, scene.structure.tests, pageObject) };
  }
  const goalMet = !step.goal || checkGoal(step.goal.check, { allPass: result.metrics.broken === 0, locators: choices, places: structure?.places });
  return { kind: 'page', mode: 'locators', changes, learnerChanges, choices, run: result, structure, escapedBugs: 0, goalMet };
}

function evalTiming(step: Step, scene: TimingScene, learner: Learner): TimingEval {
  const learnerLatency = scene.latency === 'learner';
  const learnerStrategy = scene.strategy === 'learner';
  const latency = learnerLatency ? learner.timing.latency : (scene.latency as number);
  const strategy = learnerStrategy ? learner.timing.strategy : (scene.strategy as WaitStrategy);
  const sleepMs = learnerStrategy ? learner.timing.sleepMs : (scene.sleepMs ?? 1000);
  const result = runTiming({ latencyMs: latency, strategy, sleepMs });
  const goalMet = !step.goal || checkGoal(step.goal.check, { allPass: result.metrics.failed === 0, timing: result.metrics });
  return { kind: 'timing', latency, strategy, sleepMs, learnerLatency, learnerStrategy, result, escapedBugs: 0, goalMet };
}

export const DEFAULT_SUITE_OPTIONS: SuiteOptions = { data: 'shared', order: 'written', workers: 1, waits: 'auto', retries: 0, runs: 1 };

function evalSuite(step: Step, scene: SuiteScene, learner: Learner, lesson?: Pick<Lesson, 'suites'>): SuiteEval {
  const def = lesson?.suites?.[scene.suite];
  if (!def) throw new Error(`Unknown suite "${scene.suite}"`);
  const controls = scene.controls ?? [];
  const mine = learner.suites[scene.suite] ?? {};
  const options: SuiteOptions = { ...DEFAULT_SUITE_OPTIONS, ...scene.options };
  for (const k of controls) if (mine[k] !== undefined) (options as Record<string, unknown>)[k] = mine[k];
  const result = runSuite(def, options);
  const goalMet = !step.goal || checkGoal(step.goal.check, { allPass: result.metrics.failing === 0, suite: { id: scene.suite, m: result.metrics } });
  return { kind: 'suite', suiteId: scene.suite, def, options, controls, result, escapedBugs: result.metrics.realBugCaught ? 0 : def.tests.some((t) => t.realBug) ? 1 : 0, goalMet };
}

type GoalFacts = { allPass: boolean; probe?: ProbeResult | null; feeYouFails?: boolean; cardWrong?: Set<string>; boardDone?: Record<string, boolean>; covFails?: boolean; pipeline?: { id: string; m: PipelineRun['metrics'] }; request?: { statuses: Set<number>; found: Set<string>; catches: boolean }; locators?: LocatorChoices; places?: number; traceFrame?: string | null; timing?: TimingResult['metrics']; suite?: { id: string; m: SuiteResult['metrics'] } };

export function checkGoal(check: GoalCheck, f: GoalFacts): boolean {
  switch (check.kind) {
    case 'probe-fails':
      return f.probe != null && f.probe.amount === check.amount && !f.probe.passed;
    case 'all-pass':
      return f.allPass;
    case 'fee-fails':
      return !!f.feeYouFails;
    case 'card-wrong':
      return !!f.cardWrong?.has(check.id);
    case 'board-complete':
      return !!f.boardDone?.[check.board];
    case 'cov-fails':
      return !!f.covFails;
    case 'statuses-seen':
      return !!f.request && check.statuses.every((s) => f.request!.statuses.has(s));
    case 'bug-found':
      return !!f.request?.found.has(check.bug);
    case 'assert-catches':
      return !!f.request?.catches;
    case 'pipeline-target': {
      if (!f.pipeline || f.pipeline.id !== check.pipeline) return false;
      const m = f.pipeline.m;
      return (check.maxEscaped === undefined || m.escaped <= check.maxEscaped) && (check.maxCost === undefined || m.cost <= check.maxCost) && (check.maxSeconds === undefined || m.seconds <= check.maxSeconds);
    }
    case 'locators-hold': {
      if (!f.locators) return false;
      const r = runLocators(f.locators, check.changes);
      return r.metrics.chosen === r.metrics.elements && r.metrics.broken === 0;
    }
    case 'places-max':
      return f.places !== undefined && f.places <= check.max;
    case 'trace-frame':
      return f.traceFrame === check.frame;
    case 'timing-target':
      return !!f.timing && f.timing.failed === 0 && (check.maxWaitSeconds === undefined || f.timing.waitedSeconds <= check.maxWaitSeconds);
    case 'load-limit':
    case 'load-target':
      return false;
    case 'suite-target': {
      if (!f.suite || f.suite.id !== check.suite) return false;
      const m = f.suite.m;
      return (
        (check.maxFalseFailures === undefined || m.falseFailures <= check.maxFalseFailures) &&
        (check.maxSeconds === undefined || m.seconds <= check.maxSeconds) &&
        (!check.realBug || m.realBugCaught) &&
        (!check.noFlaky || m.flaky === 0) &&
        (!check.noHidden || m.hiddenFlaky === 0)
      );
    }
  }
}

/** Learner presses a card button: records the attempt and moves the card if the code allows it. */
export function attemptCard(learner: Learner, action: Transition['action'], bug: boolean): Learner {
  const t: Transition = { from: learner.card.state, action };
  const next = codeNext({ bug }, t);
  return { ...learner, card: { state: next ?? learner.card.state, tried: [...learner.card.tried, t] } };
}

/** Representative amount for a fee band, for the learner's amount switch. */
export const feeAmountFor = (band: 'low' | 'high') => BAND_AMOUNT[band];
export { ruleOf };
