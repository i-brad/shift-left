'use client';

import { IsoBox, IsoScene, IsoText, Label, Pipe, type IsoTone, type Point3 } from '@shift-left/iso';
import type { SuiteEval } from '@shift-left/lessons';

const SEC = 1.1;

/** Workers as lanes; each test is a block along time. Red blocks failed, butter ones passed on retry. */
export function SuiteScene({ evalState, reducedMotion, hideResults }: { evalState: SuiteEval; reducedMotion: boolean; hideResults: boolean }) {
  const { result, options, def } = evalState;
  const lanes = Math.max(1, options.workers);
  const LANE = 2.4;
  const end = Math.max(result.last.seconds, 8);
  const width = end * SEC + 1;
  const bounds: Point3[] = [[-7, 0, 3], [width, 0, 3], [-7, lanes * LANE, 0], [width, lanes * LANE, 0]];
  const labelOf = new Map(def.tests.map((t) => [t.id, t]));
  const label = hideResults
    ? `${def.tests.length} tests on ${lanes} worker${lanes > 1 ? 's' : ''}. Predict first.`
    : `${result.metrics.failing} of ${def.tests.length} tests failing, ${result.metrics.falseFailures} for reasons other than a real bug. ${result.last.seconds} s.`;
  return (
    <IsoScene bounds={bounds} pad={[70, 60, 60, 40]} label={label} reducedMotion={reducedMotion} className="scene-svg">
      <IsoBox x={-6.4} y={lanes * LANE * 0.5 - 1.2} w={2.4} d={2.4} h={1.6} tone={options.data === 'fresh' ? 'sage' : options.data === 'reset' ? 'butter' : 'sky'} />
      <IsoText at={[-4, lanes * LANE * 0.5 + 1.2, 0]} dy={18} size={11}>{options.data === 'fresh' ? 'Own data' : 'Database'}</IsoText>
      {Array.from({ length: lanes }, (_, w) => (
        <g key={w}>
          <IsoBox x={0} y={w * LANE} w={width - 1} d={1.6} h={0.1} tone="cream" />
          <IsoText at={[-0.3, w * LANE + 1.2, 0]} dy={4} anchor="end" size={10.5} weight={500} muted>{`worker ${w + 1}`}</IsoText>
          {options.data !== 'fresh' && <Pipe from={[-4, lanes * LANE * 0.5, 0.8]} to={[0, w * LANE + 0.8, 0.2]} dots={0} />}
        </g>
      ))}
      {result.last.outcomes.flatMap((o) =>
        o.attempts.map((a, k) => {
          const tone: IsoTone = hideResults ? 'cream' : a.passed ? (k > 0 ? 'butter' : labelOf.get(o.id)!.writes ? 'lavender' : 'sage') : 'rose';
          return (
            <g key={`${o.id}-${k}`} data-testid={`test-${o.id}`} data-status={hideResults ? '' : o.status} data-attempt={k}>
              <IsoBox x={a.start * SEC + 0.1} y={a.worker * LANE + 0.2} w={Math.max(0.4, (a.end - a.start) * SEC - 0.2)} d={1.2} h={labelOf.get(o.id)!.writes ? 1.1 : 0.7} tone={tone} />
            </g>
          );
        }),
      )}
      {!hideResults &&
        result.last.outcomes
          .filter((o) => o.attempts[0] && !o.attempts[0].passed)
          .map((o) => {
            const a = o.attempts[0]!;
            return (
              <g key={`c-${o.id}`} className="pin">
                <Label at={[(a.start + (a.end - a.start) / 2) * SEC, a.worker * LANE + 0.8, 1.1]} lift={6} tone="bad" text={o.cause === 'bug' ? 'real bug' : o.cause === 'timing' ? 'too slow' : 'data clash'} />
              </g>
            );
          })}
    </IsoScene>
  );
}
