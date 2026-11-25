'use client';

import { IsoBox, IsoScene, IsoText, Label, Plate, type IsoTone, type Point3 } from '@shift-left/iso';
import type { PageEval } from '@shift-left/lessons';
import { LOCATOR_KINDS, PAGE_ELEMENTS, type PageElementId } from '@shift-left/sim';

const kindLabel = new Map(LOCATOR_KINDS.map((k) => [k.id, k.label]));

/** Kudi's page on a slab. Elements glow green when their locator still finds them, rose when it snapped. */
export function PageScene({ evalState, reducedMotion }: { evalState: PageEval; reducedMotion: boolean }) {
  if (evalState.mode === 'trace') return <TraceView evalState={evalState} reducedMotion={reducedMotion} />;
  const { run, changes } = evalState;
  const redesign = changes.includes('redesign');
  const data = changes.includes('data');
  const res = new Map(run.results.map((r) => [r.id, r]));
  const tone = (id: PageElementId): IsoTone => {
    const r = res.get(id)!;
    return !r.code ? 'cream' : r.holds ? 'sage' : 'rose';
  };
  // Positions move with the redesign: fields swap, the button joins a row.
  const pos: Record<PageElementId, { x: number; y: number; w: number }> = redesign
    ? { amount: { x: 7.6, y: 1.2, w: 3.6 }, recipient: { x: 12, y: 1.2, w: 3.6 }, send: { x: 16.6, y: 2.4, w: 2.4 }, balance: { x: 1.2, y: 1.2, w: 4.4 } }
    : { recipient: { x: 7.6, y: 1.2, w: 3.6 }, amount: { x: 12, y: 1.2, w: 3.6 }, send: { x: 16.4, y: 1.2, w: 2.4 }, balance: { x: 1.2, y: 1.2, w: 4.4 } };
  const bounds: Point3[] = [[0, 0, 3], [20.5, 0, 3], [0, 5, 0], [20.5, 5, 0]];
  const label = `Kudi's transfer page${redesign ? ', redesigned' : ''}${data ? ', after Ada\'s balance changed' : ''}. ${run.metrics.holding} of ${run.metrics.elements} elements still found.`;

  return (
    <IsoScene bounds={bounds} pad={[60, 40, 50, 40]} label={label} reducedMotion={reducedMotion} className="scene-svg">
      <Plate x={-0.2} y={-0.2} w={20.4} d={5.2} />
      <IsoBox x={0.6} y={0.6} w={5.6} d={3.4} h={0.3} tone="cream" />
      <IsoText at={[6.2, 4, 0.3]} dy={30} size={11}>Balance card</IsoText>
      <IsoBox x={7} y={0.6} w={12.6} d={3.4} h={0.3} tone={redesign ? 'lavender' : 'cream'} />
      <IsoText at={[19.6, 4, 0.3]} dy={16} size={11}>{redesign ? 'Send panel (v2)' : 'Send form'}</IsoText>
      {PAGE_ELEMENTS.map((el) => {
        const p = pos[el.id];
        const h = el.id === 'send' ? 0.9 : 0.5;
        return (
          <g key={el.id} data-testid={`el-${el.id}`} data-state={!res.get(el.id)!.code ? 'none' : res.get(el.id)!.holds ? 'found' : 'lost'}>
            <IsoBox x={p.x} y={p.y} z={0.3} w={p.w} d={el.id === 'send' ? 1.2 : 2.2} h={h} tone={tone(el.id)} />
          </g>
        );
      })}
      {PAGE_ELEMENTS.map((el) => {
        const p = pos[el.id];
        const r = res.get(el.id)!;
        const text = el.id === 'balance' ? (data ? '₦595,000' : '₦600,000') : el.id === 'send' ? (redesign ? 'Send money' : 'Send') : el.label;
        return (
          <g key={`l-${el.id}`} className="pin">
            <IsoText at={[p.x + p.w, p.y + (el.id === 'send' ? 1.2 : 2.2), 0.3]} dy={16} size={10.5} weight={600}>{text}</IsoText>
            <Label at={[p.x + p.w / 2, p.y + 0.6, el.id === 'send' ? 1.2 : 0.8]} lift={8} tone={!r.code ? 'neutral' : r.holds ? 'good' : 'bad'} text={r.kind ? `${kindLabel.get(r.kind)} ${r.holds ? '✓' : '✗'}` : 'no locator'} />
          </g>
        );
      })}
    </IsoScene>
  );
}

function TraceView({ evalState, reducedMotion }: { evalState: Extract<PageEval, { mode: 'trace' }>; reducedMotion: boolean }) {
  const { frames, frame } = evalState;
  const GAP = 4.2;
  const bounds: Point3[] = [[0, 0, 3], [frames.length * GAP, 0, 3], [0, 3.5, 0], [frames.length * GAP, 3.5, 0]];
  return (
    <IsoScene bounds={bounds} pad={[70, 60, 70, 60]} label={`A trace of ${frames.length} frames. ${frame ? `Frame ${frames.findIndex((f) => f.id === frame) + 1} selected.` : 'No frame selected.'}`} reducedMotion={reducedMotion} className="scene-svg">
      <IsoBox x={-0.4} y={1.2} w={frames.length * GAP} d={0.8} h={0.15} tone="cream" />
      {frames.map((f, i) => {
        const sel = f.id === frame;
        const tone: IsoTone = f.failed ? 'rose' : sel ? 'lavender' : f.network.length ? 'sky' : 'cream';
        return (
          <g key={f.id} data-testid={`frame-${f.id}`} data-selected={sel}>
            <IsoBox x={i * GAP} y={0} w={3} d={3} h={sel ? 1.6 : 0.8} tone={tone} />
            <IsoText at={[i * GAP + 3, 3, 0]} dy={18} size={11}>{`${i + 1}`}</IsoText>
          </g>
        );
      })}
      {frames.map((f, i) => (
        <g key={`b-${f.id}`} className="pin">
          {f.page.balance && <Label at={[i * GAP + 1.5, 1.5, f.id === frame ? 1.6 : 0.8]} lift={6} tone={f.failed ? 'bad' : 'neutral'} text={f.page.balance} />}
        </g>
      ))}
    </IsoScene>
  );
}
