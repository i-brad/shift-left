'use client';

import { IsoBox, IsoScene, IsoText, Label, type IsoTone, type LabelTone, type Point3 } from '@shift-left/iso';
import type { BoardEval } from '@shift-left/lessons';

const STEP_X = 3.4;
const ROW_GAP = 5;
const TILE = 2.4;

/**
 * Items sit on planks laid along the x axis, which runs diagonally down-right on screen,
 * so each chip gets its own height and nothing overlaps. Classify boards get one plank per zone
 * plus a tray of unsorted items at the back.
 */
export function BoardScene({ evalState, reducedMotion }: { evalState: BoardEval; reducedMotion: boolean }) {
  const { def, run, checked } = evalState;
  const status = new Map(run.results.map((r) => [r.id, r]));
  const rows =
    def.mode === 'classify'
      ? [{ id: '__tray', label: 'To sort', tone: 'cream' as IsoTone }, ...(def.zones ?? []).map((z) => ({ id: z.id, label: z.label, tone: z.tone as IsoTone }))]
      : [{ id: '__all', label: '', tone: 'cream' as IsoTone }];

  const rowOf = (itemId: string) => {
    if (def.mode === 'select') return 0;
    const picked = status.get(itemId)?.picked;
    const k = rows.findIndex((r) => r.id === picked);
    return k < 0 ? 0 : k;
  };

  const perRow = new Map<number, number>();
  const placed = def.items.map((it) => {
    const row = rowOf(it.id);
    const col = perRow.get(row) ?? 0;
    perRow.set(row, col + 1);
    return { it, row, col };
  });
  const maxCols = Math.max(def.mode === 'select' ? def.items.length : 4, ...perRow.values(), 3);
  const length = maxCols * STEP_X + 1;

  const bounds: Point3[] = [[-1, 0, 3], [length, 0, 0], [-1, (rows.length - 1) * ROW_GAP + TILE, 0], [length, (rows.length - 1) * ROW_GAP + TILE, 3]];

  const toneFor = (id: string): { tile: IsoTone; chip: LabelTone; mark: string } => {
    const r = status.get(id)!;
    const picked = r.picked !== undefined;
    if (!checked) return picked ? { tile: 'lavender', chip: 'you', mark: '' } : { tile: 'cream', chip: 'neutral', mark: '' };
    if (r.status === 'right') return { tile: 'sage', chip: 'good', mark: ' ✓' };
    if (r.status === 'wrong') return { tile: 'rose', chip: 'bad', mark: ' ✕' };
    if (r.status === 'missed') return { tile: 'pink', chip: 'bad', mark: ' missed' };
    return { tile: 'cream', chip: 'neutral', mark: '' };
  };

  const label = `${def.title}. ${checked ? `${run.metrics.right} right, ${run.metrics.wrong} wrong, ${run.metrics.missed} missed.` : 'Not checked yet.'}`;

  return (
    <IsoScene bounds={bounds} pad={[60, 120, 40, 140]} label={label} reducedMotion={reducedMotion} className="scene-svg">
      {rows.map((r, k) => (
        <g key={r.id} data-testid={`row-${r.id}`}>
          <IsoBox x={-1} y={k * ROW_GAP - 0.4} w={length} d={TILE + 0.8} h={0.3} tone={r.tone} />
          {r.label && (
            <IsoText at={[-1, k * ROW_GAP + TILE / 2, 0.3]} dx={-10} dy={4} anchor="end" size={12.5}>
              {r.label}
            </IsoText>
          )}
        </g>
      ))}
      {placed.map(({ it, row, col }) => {
        const t = toneFor(it.id);
        const picked = status.get(it.id)!.picked !== undefined;
        const h = def.mode === 'select' && picked ? 0.9 : 0.35;
        const x = col * STEP_X;
        const y = row * ROW_GAP;
        return (
          <g key={it.id} className="pin" data-testid={`tile-${it.id}`} data-status={checked ? status.get(it.id)!.status : picked ? 'picked' : 'open'}>
            <IsoBox x={x} y={y} z={0.3} w={TILE} d={TILE} h={h} tone={t.tile} />
            <Label at={[x + TILE / 2, y + TILE / 2, 0.3 + h]} lift={4} tone={t.chip} text={`${it.short}${t.mark}`} />
          </g>
        );
      })}
    </IsoScene>
  );
}
