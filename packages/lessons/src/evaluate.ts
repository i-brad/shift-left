import { DEFAULT_MODEL, probe, randomAmounts, run, type BoundaryModel, type BoundaryRun, type MaxOperator, type ProbeResult } from '@shift-left/sim';
import type { GoalCheck, Step } from './types';

export type StepEval = {
  model: BoundaryModel;
  suite: number[];
  isRandom: boolean;
  run: BoundaryRun;
  you: ProbeResult | null;
  escapedBugs: number;
  goalMet: boolean;
};

/** Everything the player needs for one step, given the learner's input. Pure, so it is unit-tested. */
export function evaluateStep(step: Step, learner: { operator: MaxOperator; probe: number | null }): StepEval {
  const operator = step.scene.operator === 'learner' ? learner.operator : step.scene.operator;
  const model: BoundaryModel = { ...DEFAULT_MODEL, maxOperator: operator };
  const isRandom = !Array.isArray(step.scene.suite);
  const suite = Array.isArray(step.scene.suite)
    ? [...(step.scene.suite as readonly number[])]
    : randomAmounts((step.scene.suite as { random: number }).random);
  const result = run(model, suite);
  const you = learner.probe == null ? null : probe(model, learner.probe);
  const escapedBugs = step.scene.incident && operator === '<' ? 1 : 0;
  return { model, suite, isRandom, run: result, you, escapedBugs, goalMet: step.goal ? goalMet(step.goal.check, result, you) : true };
}

export function goalMet(check: GoalCheck, result: BoundaryRun, you: ProbeResult | null): boolean {
  switch (check.kind) {
    case 'probe-fails':
      return you != null && you.amount === check.amount && !you.passed;
    case 'all-pass':
      return result.metrics.failing === 0;
  }
}
