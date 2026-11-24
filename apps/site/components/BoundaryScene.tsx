'use client';

import { IsoBox, IsoScene, IsoText, Label, Person, Pipe, Plate, Server, TopQuad, labelWidth, project, type LabelTone, type Point3 } from '@shift-left/iso';
import type { StepEval } from '@shift-left/lessons';
import type { SceneState } from '@shift-left/lessons';

const naira = (v: number) => `${v < 0 ? '-' : ''}₦${Math.abs(v).toLocaleString('en-NG')}`;

/** Ruler geometry: amounts mapped onto a 20-unit slab, log scale in the valid range. */
const RY = -10, RD = 2.6, RZ = 0.5;
function rulerX(v: number, min: number, max: number): number {
  const c = Math.min(Math.max(v, 0), max * 2);
  const t = c <= min ? (0.18 * c) / min : c <= max ? 0.18 + (0.62 * Math.log(c / min)) / Math.log(max / min) : 0.8 + 0.2 * Math.min(1, (c - max) / max);
  return 0.4 + 19.2 * t;
}

const BOUNDS: Point3[] = [[0, RY, 7.5], [20, RY, 0], [0.3, 5.4, 0], [24, 3, 0], [20, RY + RD, 0], [16.5, 0, 6]];

type Pin = { amount: number; x: number; passed: boolean; you: boolean; text: string; h: number };

/** Stack chips so none overlap in screen space (2D rectangle packing, lowest free row first). */
function packPins(pins: Omit<Pin, 'h'>[]): Pin[] {
  const placed: [number, number, number, number][] = [];
  return [...pins]
    .sort((a, b) => a.x - b.x)
    .map((p) => {
      const w = labelWidth(p.text);
      for (let row = 0; ; row++) {
        const h = 1.5 + row * 1.2;
        const [cx, cy] = project([p.x, RY + 1.27, RZ + h]);
        const r: [number, number, number, number] = [cx - w / 2 - 4, cy - 27, cx + w / 2 + 4, cy - 1];
        if (!placed.some((q) => r[0] < q[2] && r[2] > q[0] && r[1] < q[3] && r[3] > q[1])) {
          placed.push(r);
          return { ...p, h };
        }
      }
    });
}

export function BoundaryScene({ evalState, scene, reducedMotion }: { evalState: StepEval; scene: SceneState; reducedMotion: boolean }) {
  const { model, run, you, isRandom, escapedBugs } = evalState;
  const X = (v: number) => rulerX(v, model.min, model.max);
  const failing = run.metrics.failing > 0;
  const bugLive = model.maxOperator === '<';
  const validatorRed = !!scene.incident && bugLive;

  const pins = packPins([
    ...(isRandom ? [] : run.results.map((r) => ({ amount: r.amount, x: X(r.amount), passed: r.passed, you: false, text: `${naira(r.amount)} ${r.passed ? '✓' : '✕'}` }))),
    ...(you ? [{ amount: you.amount, x: X(you.amount), passed: you.passed, you: true, text: `you: ${naira(you.amount)} ${you.passed ? '✓' : '✕'}` }] : []),
  ]);

  // Random tests pile up as cubes, bucketed by position.
  const piles: { x: number; k: number }[] = [];
  if (isRandom) {
    const counts = new Map<number, number>();
    for (const x of run.results.map((r) => Math.round(X(r.amount) * 1.5) / 1.5).sort((a, b) => a - b)) {
      const k = (counts.get(x) ?? 0) + 1;
      counts.set(x, k);
      piles.push({ x, k });
    }
  }

  const tiles = Math.min(isRandom ? 16 : run.results.length, 16);
  const tileGrid = Array.from({ length: tiles }, (_, i) => ({
    x: 1.3 + (i % 4) * 1.02,
    y: 0.3 + Math.floor(i / 4) * 1.02,
    passed: isRandom ? true : run.results[i]?.passed ?? true,
  })).sort((a, b) => a.x + a.y - (b.x + b.y));

  const ruleTone: LabelTone = validatorRed ? 'bad' : bugLive ? 'neutral' : 'good';
  const label = `Test suite with ${run.metrics.tests} tests, ${run.metrics.failing} failing. Validator rule: amount ${model.maxOperator} ${naira(model.max)}.`;

  return (
    <IsoScene bounds={BOUNDS} pad={[30, 60, 40, 30]} label={label} reducedMotion={reducedMotion} className="scene-svg">
      {/* Ruler of amounts */}
      <IsoBox x={0} y={RY} w={20} d={RD} h={RZ} tone="cream" testId="ruler" />
      {scene.zones && (
        <g data-testid="zones">
          <TopQuad x0={0} x1={X(model.min)} y={RY} d={RD} z={RZ} tone="pink" />
          <TopQuad x0={X(model.min)} x1={X(model.max)} y={RY} d={RD} z={RZ} tone="sky" />
          <TopQuad x0={X(model.max)} x1={20} y={RY} d={RD} z={RZ} tone="pink" />
          <IsoText at={[X(model.min) / 2, RY + RD - 0.35, RZ]} size={10.5}>TOO SMALL</IsoText>
          <IsoText at={[X(30_000), RY + RD - 0.35, RZ]} size={10.5}>VALID</IsoText>
          <IsoText at={[(X(model.max) + 20) / 2, RY + RD - 0.35, RZ]} size={10.5}>TOO BIG</IsoText>
        </g>
      )}
      {[[0, '₦0'], [model.min, '₦100'], [5000, '₦5k'], [model.max, '₦500k'], [model.max * 2, '₦1m']].map(([v, t]) => (
        <IsoText key={t as string} at={[X(v as number), RY + RD, 0]} dy={21} size={11} weight={500} muted>
          {t}
        </IsoText>
      ))}
      <IsoText at={[X(model.max * 2), RY + RD, 0]} dy={40} dx={14} size={11} weight={500} muted anchor="end">
        transfer amount →
      </IsoText>

      {piles.map((p, i) => (
        <g key={i} className="pin" style={{ animationDelay: `${i * 14}ms` }}>
          <IsoBox x={p.x - 0.3} y={RY + 1} z={RZ + (p.k - 1) * 0.6} w={0.6} d={0.6} h={0.6} tone="sage" />
        </g>
      ))}
      {isRandom && <Label at={[X(3000), RY + 1.3, RZ + 5.2]} tone="good" text={`${run.metrics.tests} random tests, ${run.metrics.tests - run.metrics.failing} ✓, all one group`} />}

      {pins.map((p, i) => (
        <g key={`post-${p.amount}-${p.you}`} className="pin" style={{ animationDelay: `${i * 80}ms` }} data-testid={p.you ? 'your-post' : 'post'}>
          <IsoBox x={p.x - 0.17} y={RY + 1.1} z={RZ} w={0.34} d={0.34} h={p.h} tone={p.you ? 'lavender' : p.passed ? 'sage' : 'rose'} />
        </g>
      ))}
      {pins.map((p, i) => (
        <g key={`chip-${p.amount}-${p.you}`} className="pin" style={{ animationDelay: `${i * 80}ms` }}>
          <Label at={[p.x, RY + 1.27, RZ + p.h]} lift={3} text={p.text} tone={p.you ? 'you' : p.passed ? 'good' : 'bad'} />
        </g>
      ))}

      {/* Test suite */}
      <Plate x={0.3} y={-0.7} w={5.9} d={5.9} />
      <IsoBox x={1} y={0} w={4.5} d={4.5} h={2.2} tone="lavender" testId="suite" />
      {tileGrid.map((t, i) => (
        <IsoBox key={i} x={t.x} y={t.y} z={2.2} w={0.8} d={0.8} h={0.35} tone={t.passed ? 'sage' : 'rose'} />
      ))}
      <IsoText at={[5.5, 4.5, 1.1]} dy={5}>{scene.ci ? 'CI · Playwright' : 'Test suite'}</IsoText>
      <Label at={[3.25, 2.25, 2.6]} lift={30} tone="hint" text={`${run.metrics.tests} test${run.metrics.tests === 1 ? '' : 's'} · ${run.metrics.suiteSeconds} s`} />

      <Pipe from={[5.6, 2.25, 0.9]} to={[11.9, 2.25, 0.9]} dots={3} dotColor={failing ? '#e07f7f' : '#ef9f55'} />

      {/* Validator */}
      <Server x={12} y={0} title="Validator" tone={validatorRed ? 'rose' : 'sky'} rule={`amount ${model.maxOperator} 500,000`} ruleTone={ruleTone} />

      {/* Customers */}
      <Plate x={19.2} y={-1.2} w={4.4} d={4.4} />
      <Person at={[20.4, -0.3, 0.25]} color="#f4b98a" />
      <Person at={[22, 0.2, 0.25]} color="#b9d0f3" />
      <Person at={[20.8, 1.4, 0.25]} color="#c0e0b4" />
      <Person at={[22.4, 1.9, 0.25]} color="#f3bcc7" />
      <IsoText at={[23.6, 3.2, 0]} dy={20} size={12} weight={600} muted>
        Customers
      </IsoText>
      {scene.incident && (
        <g data-testid="customer-request" data-status={bugLive ? 'rejected' : 'sent'}>
          <Pipe from={[19.1, 1.8, 0.8]} to={[16.6, 1.8, 0.8]} tone={bugLive ? 'bad' : 'good'} dots={2} dotColor={bugLive ? '#e07f7f' : '#98c98b'} />
          <Label at={[21.6, -1.6, 2.4]} lift={6} tone={bugLive ? 'bad' : 'good'} text={bugLive ? '₦500,000 rejected ✕' : '₦500,000 sent ✓'} />
        </g>
      )}
      {escapedBugs > 0 && <title>One bug has escaped to customers.</title>}
    </IsoScene>
  );
}
