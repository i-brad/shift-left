'use client';

import { IsoBox, IsoScene, IsoText, Label, type Point3 } from '@shift-left/iso';
import type { LoadEval } from '@shift-left/lessons';
import { LOAD_STEPS } from '@shift-left/sim';

const MS_PER_UNIT = 220;
const MAX_H = 12;
const h = (ms: number) => Math.min(MAX_H, ms / MS_PER_UNIT);
const GAP = 3.6;

/** One tower per load level: its height is p95 latency. The glass sheet is the threshold. */
export function LoadScene({ evalState, reducedMotion, hideResults }: { evalState: LoadEval; reducedMotion: boolean; hideResults: boolean }) {
  const { sweep, users, thresholdMs, marked, servers } = evalState;
  const width = LOAD_STEPS.length * GAP;
  const bounds: Point3[] = [[-1, 0, MAX_H], [width, 0, MAX_H], [-1, 3, 0], [width, 3, 0]];
  const cur = evalState.current;
  const th = h(thresholdMs);
  const label = hideResults
    ? `Load test at ${users} users on ${servers} server${servers > 1 ? 's' : ''}. Predict first.`
    : `${users} users on ${servers} server${servers > 1 ? 's' : ''}: p95 ${cur.p95} ms, ${cur.errorPct}% errors, ${cur.passed ? 'meets' : 'misses'} the ${thresholdMs} ms threshold.`;
  return (
    <IsoScene bounds={bounds} pad={[60, 80, 60, 60]} label={label} reducedMotion={reducedMotion} className="scene-svg">
      <IsoBox x={-0.8} y={-0.4} w={width + 0.4} d={3} h={0.15} tone="cream" />
      {sweep.map((r, i) => {
        const isCur = r.users === users;
        const show = !hideResults || r.users < users;
        const tone = !show ? 'cream' : isCur ? (r.passed ? 'sage' : 'rose') : r.passed ? 'sky' : 'pink';
        return (
          <g key={r.users} data-testid={`load-${r.users}`} data-passed={show ? r.passed : ''} data-current={isCur}>
            <IsoBox x={i * GAP} y={0} w={2} d={2} h={Math.min(th, show ? Math.max(0.2, h(r.p95)) : 0.2)} tone={tone} />
            <IsoText at={[i * GAP + 2, 2, 0]} dy={18} size={11} weight={isCur ? 700 : 500}>{`${r.users} users`}</IsoText>
          </g>
        );
      })}
      <IsoBox x={-0.8} y={-0.5} z={th} w={width + 0.4} d={0.15} h={0.08} tone="lavender" />
      {sweep.map((r, i) =>
        (!hideResults || r.users < users) && h(r.p95) > th ? <IsoBox key={`top-${r.users}`} x={i * GAP} y={0} z={th + 0.04} w={2} d={2} h={h(r.p95) - th - 0.04} tone={r.users === users ? 'rose' : 'pink'} /> : null,
      )}
      <IsoText at={[width - 0.4, -0.4, th]} dy={-6} size={11} weight={600}>{`threshold p95 < ${thresholdMs} ms`}</IsoText>
      <IsoBox x={-0.8} y={2.4} z={th} w={width + 0.4} d={0.15} h={0.08} tone="lavender" />
      {sweep.map((r, i) =>
        (!hideResults || r.users < users) && (r.users === users || r.users === marked) ? (
          <g key={`l-${r.users}`} className="pin">
            <Label at={[i * GAP + 1, 1, Math.max(0.2, h(r.p95))]} lift={10} tone={r.passed ? 'good' : 'bad'} text={`${r.users === marked ? 'your limit · ' : ''}p95 ${r.p95 >= 1000 ? `${(r.p95 / 1000).toFixed(1)} s` : `${r.p95} ms`}${r.errorPct ? ` · ${r.errorPct}% errors` : ''}`} />
          </g>
        ) : null,
      )}
    </IsoScene>
  );
}
