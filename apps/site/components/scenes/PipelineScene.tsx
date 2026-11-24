'use client';

import { IsoBox, IsoScene, IsoText, Label, Person, Pipe, Plate, type Point3 } from '@shift-left/iso';
import type { PipelineEval } from '@shift-left/lessons';

const GAP = 7;
const SIZE = 3.4;
const naira = (v: number) => `₦${v.toLocaleString('en-NG')}`;

/** Stages stand on a conveyor; each defect lands in front of the stage that caught it, or with the customers. */
export function PipelineScene({ evalState, reducedMotion }: { evalState: PipelineEval; reducedMotion: boolean }) {
  const { def, run, enabled } = evalState;
  const on = new Set(enabled);
  const n = def.stages.length;
  const length = (n - 1) * GAP + SIZE;
  const caughtAt = new Map<string, string[]>();
  for (const r of run.results) caughtAt.set(r.caughtAt, [...(caughtAt.get(r.caughtAt) ?? []), r.id]);
  const short = new Map(def.defects.map((d) => [d.id, d.label]));

  const maxStack = Math.max(1, ...[...caughtAt.values()].map((v) => v.length));
  const bounds: Point3[] = [[0, -2 - maxStack * 1.8, 4], [length, -2 - maxStack * 1.8, 0], [0, SIZE + 3, 0], [length, SIZE + 3, 0]];
  const label = `${def.title}. ${run.metrics.caught} of ${run.metrics.defects} defects caught, ${run.metrics.escaped} reached customers, fixing cost ${naira(run.metrics.cost)}.`;

  return (
    <IsoScene bounds={bounds} pad={[50, 170, 60, 150]} label={label} reducedMotion={reducedMotion} className="scene-svg">
      <IsoBox x={-0.6} y={SIZE / 2 - 0.6} w={length + 1.2} d={1.2} h={0.2} tone="cream" />
      <Pipe from={[-0.4, SIZE / 2, 0.3]} to={[length + 0.4, SIZE / 2, 0.3]} dots={reducedMotion ? 0 : 4} />
      {def.stages.map((s, i) =>
        (caughtAt.get(s.id) ?? [])
          .map((id, k) => ({ id, k, x: i * GAP, isEnd: s.id === def.end, at: s.id }))
          .reverse()
          .map(({ id, k, x, isEnd, at }) => (
            <g key={id} className="pin" data-testid={`defect-${id}`} data-at={at}>
              <IsoBox x={x + 1.2} y={-2.2 - k * 1.8} w={1} d={1} h={0.8} tone={isEnd ? 'rose' : 'sage'} />
            </g>
          )),
      )}
      {def.stages.map((s, i) => {
        const x = i * GAP;
        const isEnd = s.id === def.end;
        const active = on.has(s.id) && !isEnd;
        const caught = caughtAt.get(s.id) ?? [];
        return (
          <g key={s.id} data-testid={`stage-${s.id}`} data-on={active}>
            {isEnd ? (
              <>
                <Plate x={x} y={0} w={SIZE} d={SIZE} />
                <Person at={[x + 1, x === 0 ? 1 : 1, 0.25]} color="#b9d0f3" />
                <Person at={[x + 2.4, 1.6, 0.25]} color="#c0e0b4" />
                <Person at={[x + 1.4, 2.6, 0.25]} color="#f3bcc7" />
              </>
            ) : (
              <IsoBox x={x} y={0} w={SIZE} d={SIZE} h={active ? 1.8 : 0.5} tone={active ? 'sky' : 'cream'} />
            )}
            <IsoText at={[x + SIZE, SIZE, 0]} dy={20} size={12}>{s.label}</IsoText>
            <IsoText at={[x + SIZE, SIZE, 0]} dy={35} size={10.5} weight={500} muted>
              {isEnd ? `${naira(s.cost)} each` : active ? `${naira(s.cost)} to fix · ${s.seconds}s` : 'off'}
            </IsoText>
          </g>
        );
      })}
      {def.stages.map((s, i) =>
        (caughtAt.get(s.id) ?? []).map((id, k) => (
          <g key={`label-${id}`} className="pin">
            <Label at={[i * GAP + 1.7, -1.7 - k * 1.8, 0.8]} lift={4} tone={s.id === def.end ? 'bad' : 'good'} text={short.get(id) ?? id} />
          </g>
        )),
      )}
    </IsoScene>
  );
}
