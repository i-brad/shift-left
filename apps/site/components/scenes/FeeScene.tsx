'use client';

import { IsoBox, IsoScene, IsoText, Label, Person, Pipe, Plate, Server, type IsoTone, type Point3 } from '@shift-left/iso';
import type { FeeEval, FeeScene as FeeSceneState } from '@shift-left/lessons';
import { ALL_COMBOS, comboId, type FeeCombo } from '@shift-left/sim';

const naira = (v: number) => `₦${v.toLocaleString('en-NG')}`;

/** The combination cube: x = tier, y = amount band, z = express. */
const CX = 3, CY = -13, S = 2.2, G = 0.35;
const cell = (c: FeeCombo) => ({ x: CX + (c.tier === 'plus' ? 1 : 0) * (S + G), y: CY + (c.band === 'high' ? 1 : 0) * (S + G), z: c.express ? S + G : 0 });

const BOUNDS: Point3[] = [[CX, CY, 2 * S + 4], [CX + 2 * S, CY, 0], [0, 6, 0], [24, 3, 0], [CX, CY + 2 * S, 0], [17, -2, 6]];

export function FeeScene({ evalState, scene, reducedMotion, hideResults = false }: { evalState: FeeEval; scene: FeeSceneState; reducedMotion: boolean; hideResults?: boolean }) {
  const { run, you, order } = evalState;
  const tested = new Map(run.results.map((r) => [r.id, r]));
  const bugLive = order === 'express-first';

  const toneOf = (id: string): IsoTone => {
    const r = tested.get(id);
    if (!r) return 'cream';
    if (hideResults) return 'sky';
    return r.passed ? 'sage' : 'rose';
  };

  // Draw back to front: low x+y first, then bottom layer before top.
  const cells = [...ALL_COMBOS].sort((a, b) => {
    const pa = cell(a), pb = cell(b);
    return pa.x + pa.y - (pb.x + pb.y) || pa.z - pb.z;
  });

  // Collapsed view: rules that ignore the amount span both bands.
  const merged = (c: FeeCombo) => scene.collapsed && (c.tier === 'plus' || c.express);

  const feeCoins = Math.max(1, Math.round(you.actual / 20));
  const label = `Combination cube: ${run.metrics.combosCovered} of 8 tested, ${hideResults ? 'results hidden' : `${run.metrics.failing} failing`}. Your transfer: ${you.combo.tier}, ${you.combo.band === 'high' ? 'over' : 'up to'} ₦5,000, ${you.combo.express ? 'express' : 'standard'}; Kudi charges ${naira(you.actual)}, spec says ${naira(you.expected)}.`;

  return (
    <IsoScene bounds={BOUNDS} pad={[30, 60, 40, 40]} label={label} reducedMotion={reducedMotion} className="scene-svg">
      {/* Combination cube */}
      <g data-testid="combo-cube">
        <Plate x={CX - 0.8} y={CY - 0.8} w={2 * S + G + 1.6} d={2 * S + G + 1.6} />
        {cells.map((c) => {
          const p = cell(c);
          const id = comboId(c);
          if (merged(c)) {
            if (c.band === 'high') return null;
            return (
              <g key={id} data-testid={`cell-${id}`} data-result={hideResults ? 'hidden' : tested.get(id)?.passed === false ? 'fail' : tested.has(id) ? 'pass' : 'untested'}>
                <IsoBox x={p.x} y={p.y} z={p.z} w={S} d={2 * S + G} h={S} tone={toneOf(id)} />
              </g>
            );
          }
          return (
            <g key={id} data-testid={`cell-${id}`} data-result={hideResults ? 'hidden' : tested.get(id)?.passed === false ? 'fail' : tested.has(id) ? 'pass' : 'untested'}>
              <IsoBox x={p.x} y={p.y} z={p.z} w={S} d={S} h={S} tone={toneOf(id)} />
            </g>
          );
        })}
        {(() => {
          const p = cell(you.combo);
          return <Label at={[p.x + S / 2, p.y + S / 2, p.z + S]} lift={6} tone="you" text={`you: ${naira(you.actual)} ${you.passed ? '✓' : '✕'}`} />;
        })()}
        <IsoText at={[CX + S + G / 2, CY + 2 * S + G + 0.8, 0]} dy={18} size={11} weight={600} muted>Basic → Plus</IsoText>
        <IsoText at={[CX - 0.8, CY + 2 * S + G + 0.8, 0]} dy={4} dx={-10} size={11} weight={600} muted anchor="end">≤₦5k → &gt;₦5k</IsoText>
        <IsoText at={[CX - 0.8, CY + 2 * S + G + 0.8, S * 1.5]} dx={-10} size={11} weight={600} muted anchor="end">express ↑</IsoText>
        <Label at={[CX, CY, 2 * S + G]} lift={30} tone="hint" text={scene.collapsed ? `${run.metrics.rulesCovered} of 5 rules tested` : `${run.metrics.combosCovered} of 8 combinations tested`} />
      </g>

      {/* Your transfer */}
      <Plate x={0.3} y={-0.7} w={5.4} d={5.4} />
      <IsoBox x={1} y={0} w={4} d={4} h={1.6} tone="lavender" testId="transfer" />
      <IsoText at={[5, 4, 0.8]} dy={5}>Your transfer</IsoText>
      <Label at={[3, 2, 1.6]} lift={10} tone="you" text={`${you.combo.tier === 'plus' ? 'Plus' : 'Basic'} · ${you.combo.band === 'high' ? '>₦5k' : '≤₦5k'} · ${you.combo.express ? 'express' : 'standard'}`} />
      <Pipe from={[5.1, 2, 0.8]} to={[11.9, 2, 0.8]} dots={2} />

      {/* Fee engine */}
      <Server x={12} y={0} title="Fee engine" tone={scene.incident && bugLive ? 'rose' : 'sky'} rule={bugLive ? 'checks express first' : 'checks tier first'} ruleTone={bugLive ? (scene.incident ? 'bad' : 'neutral') : 'good'} />

      {/* Fee charged */}
      <Pipe from={[16.6, 3.2, 0.6]} to={[19.4, 5.6, 0.6]} dots={0} tone={you.passed ? 'neutral' : 'bad'} />
      <Plate x={19.2} y={5.2} w={3} d={3} />
      {Array.from({ length: feeCoins }, (_, i) => (
        <IsoBox key={i} x={19.9} y={5.9} z={0.25 + i * 0.35} w={1.6} d={1.6} h={0.3} tone="butter" />
      ))}
      <Label at={[20.7, 6.7, 0.6 + feeCoins * 0.35]} lift={8} tone={you.passed ? 'good' : 'bad'} text={`charged ${naira(you.actual)} · spec ${naira(you.expected)}`} />

      {scene.incident && (
        <g data-testid="customer-complaint" data-status={bugLive ? 'overcharged' : 'fixed'}>
          <Plate x={19.4} y={-3.4} w={4} d={4} />
          <Person at={[20.6, -2.6, 0.25]} color="#b9d0f3" />
          <Person at={[22.2, -1.8, 0.25]} color="#c0e0b4" />
          <Label at={[21.4, -2.4, 1.5]} lift={8} tone={bugLive ? 'bad' : 'good'} text={bugLive ? 'Plus express: ₦100 ✕' : 'Plus express: ₦50 ✓'} />
        </g>
      )}
      {scene.ci && <Label at={[3, 2, 0]} lift={-34} tone="you" text="table runs in CI" />}
    </IsoScene>
  );
}
