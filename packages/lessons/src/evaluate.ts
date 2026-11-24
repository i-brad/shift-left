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
  type CardState,
  type FeeCombo,
  type FeeOrder,
  type FeeRun,
  type MaxOperator,
  type ProbeResult,
  type Tier,
  type Transition,
} from '@shift-left/sim';
import type { BoardScene, BoundaryScene, CardScene, CoverageScene, FeeScene, GoalCheck, Lesson, PipelineScene, Step } from './types';

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

export type StepEval = BoundaryEval | FeeEval | CardEval | BoardEval | CoverageEval | PipelineEval;

export function evaluateStep(step: Step, learner: Learner, lesson?: Pick<Lesson, 'boards' | 'pipelines'>): StepEval {
  switch (step.scene.kind) {
    case 'pipeline':
      return evalPipeline(step, step.scene, learner, lesson);
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

type GoalFacts = { allPass: boolean; probe?: ProbeResult | null; feeYouFails?: boolean; cardWrong?: Set<string>; boardDone?: Record<string, boolean>; covFails?: boolean; pipeline?: { id: string; m: PipelineRun['metrics'] } };

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
    case 'pipeline-target': {
      if (!f.pipeline || f.pipeline.id !== check.pipeline) return false;
      const m = f.pipeline.m;
      return (check.maxEscaped === undefined || m.escaped <= check.maxEscaped) && (check.maxCost === undefined || m.cost <= check.maxCost) && (check.maxSeconds === undefined || m.seconds <= check.maxSeconds);
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
