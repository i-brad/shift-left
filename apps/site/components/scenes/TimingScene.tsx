'use client';

import { IsoBox, IsoScene, IsoText, Label, type Point3 } from '@shift-left/iso';
import type { TimingEval } from '@shift-left/lessons';
import { TIMEOUT_MS } from '@shift-left/sim';

const MS_PER_UNIT = 160;

/** Ten runs as lanes. The bar is how long Kudi took; the post is when the test looked. */
export function TimingScene({ evalState, reducedMotion, hideResults }: { evalState: TimingEval; reducedMotion: boolean; hideResults: boolean }) {
  const { result, strategy, sleepMs } = evalState;
  const timedOut = result.runs.some((r) => r.waited >= TIMEOUT_MS);
  const maxMs = Math.min(TIMEOUT_MS + 300, Math.max(1500, ...result.runs.map((r) => Math.max(r.latency, r.waited)), strategy === 'sleep' ? sleepMs : 0) + 300);
  const u = (ms: number) => Math.min(ms, maxMs) / MS_PER_UNIT;
  const seconds = Array.from({ length: Math.floor(maxMs / 1000) + 1 }, (_, i) => i);
  const LANE = 1.9;
  const width = u(maxMs) + 1;
  const bounds: Point3[] = [[-2, 0, 2], [width, 0, 2], [-2, result.runs.length * LANE, 0], [width, result.runs.length * LANE, 0]];
  const label = hideResults
    ? `Ten runs of the test with typical latency ${evalState.latency} ms. Predict first.`
    : `${result.metrics.passed} of 10 runs pass. Waited ${result.metrics.waitedSeconds} s in total.`;
  return (
    <IsoScene bounds={bounds} pad={[60, 50, 60, 60]} label={label} reducedMotion={reducedMotion} className="scene-svg">
      <IsoBox x={0} y={-0.4} w={width - 1} d={result.runs.length * LANE + 0.2} h={0.1} tone="cream" />
      {seconds.map((s) => (
        <IsoText key={s} at={[u(s * 1000), -0.4, 0.1]} dy={-6} size={10.5} weight={500} muted>{`${s}s`}</IsoText>
      ))}
      {strategy === 'auto' && timedOut && <IsoBox x={u(TIMEOUT_MS)} y={-0.4} w={0.08} d={result.runs.length * LANE + 0.2} h={0.6} tone="rose" />}
      {strategy === 'sleep' && <IsoBox x={u(sleepMs)} y={-0.4} w={0.08} d={result.runs.length * LANE + 0.2} h={0.6} tone="butter" />}
      {result.runs.map((r, i) => {
        const y = i * LANE;
        return (
          <g key={i} data-testid={`run-${i}`} data-passed={hideResults ? '' : r.passed}>
            <IsoBox x={0} y={y} w={Math.max(0.05, u(r.latency))} d={0.7} h={0.35} tone="sky" />
            <IsoBox x={u(r.waited)} y={y - 0.05} w={0.3} d={0.8} h={1.1} tone={hideResults ? 'cream' : r.passed ? 'sage' : 'rose'} />
            <IsoText at={[-0.4, y + 0.9, 0]} dy={4} anchor="end" size={10.5} weight={500} muted>{`run ${i + 1}`}</IsoText>
          </g>
        );
      })}
      {strategy === 'sleep' && <Label at={[u(sleepMs), -0.4, 0.6]} lift={10} tone="hint" text={`sleep ${sleepMs / 1000}s`} />}
      {strategy === 'auto' && timedOut && <Label at={[u(TIMEOUT_MS), -0.4, 0.6]} lift={10} tone="bad" text="timeout 5s" />}
    </IsoScene>
  );
}
