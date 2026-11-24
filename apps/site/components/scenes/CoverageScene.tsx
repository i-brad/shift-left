'use client';

import { IsoBox, IsoScene, IsoText, Label, Pipe, type IsoTone, type LabelTone, type Point3 } from '@shift-left/iso';
import type { CoverageEval, CoverageScene as CoverageSceneState } from '@shift-left/lessons';
import type { Branch, Statement } from '@shift-left/sim';

/** A tower: one floor per line of code, top to bottom. The false path of each `if` is a ledge beside its body floor. */
const FLOOR = 1.8;
const zOf = (row: number) => (5 - row) * FLOOR;
const LINES: { id: Statement; y: number; x: number; w: number; decision?: boolean; text: (fixed: boolean) => string }[] = [
  { id: 'L1', y: 0, x: 0, w: 9, text: (f) => (f ? 'let rate = 0;' : 'let rate;') },
  { id: 'L2', y: 1, x: 0, w: 9, decision: true, text: () => "if (tier === 'plus')" },
  { id: 'L3', y: 2, x: 0, w: 5.5, text: () => 'rate = 0.01;' },
  { id: 'L4', y: 3, x: 0, w: 9, decision: true, text: () => 'if (amount > 100000)' },
  { id: 'L5', y: 4, x: 0, w: 5.5, text: () => 'rate = rate * 2;' },
  { id: 'L6', y: 5, x: 0, w: 9, text: () => 'return round(amount × rate);' },
];
const FALSE_LANES: { branch: Branch; trueBranch: Branch; y: number }[] = [
  { branch: 'tier:false', trueBranch: 'tier:true', y: 2 },
  { branch: 'big:false', trueBranch: 'big:true', y: 4 },
];

const BOUNDS: Point3[] = [[0, 0, 5 * FLOOR + 2], [10, 0, 0], [0, 2.4, 0], [10, 2.4, 0], [-4, 2.4, 0]];

export function CoverageScene({ evalState, scene, reducedMotion }: { evalState: CoverageEval; scene: CoverageSceneState; reducedMotion: boolean }) {
  const { run, fixed } = evalState;
  const failing = run.metrics.failing > 0;
  const label = `Code map of cashback(): ${run.metrics.statements} of 6 statements and ${run.metrics.branchesCovered} of 4 branches covered by ${run.metrics.tests} tests, ${run.metrics.failing} failing.`;

  return (
    <IsoScene bounds={BOUNDS} pad={[50, 120, 50, 140]} label={label} reducedMotion={reducedMotion} className="scene-svg">
      {LINES.map((l) => {
        const hit = run.lines.has(l.id);
        let tone: IsoTone = hit ? 'sage' : 'cream';
        if (l.decision) tone = hit ? 'butter' : 'cream';
        if (l.id === 'L6' && failing) tone = 'rose';
        if (l.id === 'L1' && failing && !fixed) tone = 'rose';
        const chip: LabelTone = l.id === 'L6' && failing ? 'bad' : l.id === 'L1' && !fixed && failing ? 'bad' : hit ? 'good' : 'neutral';
        return (
          <g key={l.id} data-testid={`line-${l.id}`} data-hit={hit}>
            <IsoBox x={l.x} y={0} z={zOf(l.y)} w={l.w} d={2.4} h={l.decision ? 0.7 : 0.45} tone={tone} />
            <Label at={[l.x + l.w / 2, 1.2, zOf(l.y) + (l.decision ? 0.7 : 0.45)]} lift={4} tone={chip} text={l.text(fixed)} />
          </g>
        );
      })}

      {scene.showBranches &&
        FALSE_LANES.map((lane) => {
          const taken = run.branches.has(lane.branch);
          const trueTaken = run.branches.has(lane.trueBranch);
          return (
            <g key={lane.branch} data-testid={`branch-${lane.branch}`} data-taken={taken}>
              <IsoBox x={6.6} y={0.3} z={zOf(lane.y)} w={2.6} d={1.8} h={0.2} tone={taken ? 'sage' : 'cream'} />
              <Label at={[9.2, 1.2, zOf(lane.y) + 0.2]} lift={-24} tone={taken ? 'good' : 'neutral'} text={taken ? 'false: skip ✓' : 'false: skip ?'} />
              <IsoText at={[5.5, 2.4, zOf(lane.y)]} dy={14} size={10.5} weight={600} muted>
                {trueTaken ? 'true ✓' : 'true ?'}
              </IsoText>
            </g>
          );
        })}

      <Pipe from={[-3.2, 1.2, zOf(0) + 0.4]} to={[-3.2, 1.2, 0.2]} dots={reducedMotion ? 0 : 3} tone={failing ? 'bad' : 'neutral'} dotColor={failing ? '#e07f7f' : '#ef9f55'} />
      <IsoText at={[-3.2, 1.2, zOf(0) + 0.6]} dy={-8} size={10.5} weight={600} muted>runs ↓</IsoText>
      {scene.incident && !fixed && <Label at={[9, 2.4, 0]} lift={-30} tone="bad" text="Basic cashback: ₦NaN" />}
      {scene.ci && <Label at={[9, 0, zOf(0) + 0.5]} lift={24} tone="you" text="coverage runs in CI" />}
    </IsoScene>
  );
}
