'use client';

import { IsoBox, IsoScene, IsoText, Label, Pipe, type IsoTone, type LabelTone, type Point3 } from '@shift-left/iso';
import type { CardEval, CardScene as CardSceneState } from '@shift-left/lessons';
import { INVALID_TRANSITIONS, transitionId, type CardState } from '@shift-left/sim';

/** State tiles on the floor: Active left, Frozen right, Blocked front-centre (in screen space). */
const TILE: Record<CardState, { x: number; y: number; tone: IsoTone; name: string }> = {
  active: { x: 0, y: 0, tone: 'sky', name: 'Active' },
  frozen: { x: 8, y: -8, tone: 'lavender', name: 'Frozen' },
  blocked: { x: 9, y: 3, tone: 'pink', name: 'Blocked' },
};
const W = 5, H = 0.6, Z = H + 0.3;
const centre = (s: CardState): [number, number] => [TILE[s].x + W / 2, TILE[s].y + W / 2];

/** Arrow between two state centres, shortened so it starts and ends at the tile edges, nudged sideways by `off`. */
function arrow(a: CardState, b: CardState, off: number) {
  const [ax, ay] = centre(a);
  const [bx, by] = centre(b);
  const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy);
  const ux = dx / len, uy = dy / len, cut = 3.3;
  // Screen-perpendicular nudge: world (1,1) moves straight down the screen.
  const px = off * 0.7, py = off * 0.7;
  const from: Point3 = [ax + ux * cut + px, ay + uy * cut + py, Z];
  const to: Point3 = [bx - ux * cut + px, by - uy * cut + py, Z];
  const mid: Point3 = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, Z];
  return { from, to, mid };
}

const ARROWS = [
  { id: 'active:freeze', label: 'freeze', ...arrow('active', 'frozen', -1.2) },
  { id: 'frozen:unfreeze', label: 'unfreeze', ...arrow('frozen', 'active', 1.2) },
  { id: 'active:block', label: 'block', ...arrow('active', 'blocked', 0) },
  { id: 'frozen:block', label: 'block', ...arrow('frozen', 'blocked', 0) },
] as const;
const BUG_ARROW = arrow('blocked', 'active', 1.8);

/** Where each state's refusal chips stack, outside its tile. */
const REFUSAL_ANCHOR: Record<CardState, Point3> = {
  active: [-3.4, 8.4, 0],
  frozen: [16.4, -11.4, 0],
  blocked: [17.6, 2.4, 0],
};

const BOUNDS: Point3[] = [[0, 0, 4], [13, -8, 0], [14, 3, 0], [9, 8, 0], [-4, 9, 0], [17, -12, 0], [19, 3, 0]];

export function CardScene({ evalState, scene, reducedMotion, hideResults = false }: { evalState: CardEval; scene: CardSceneState; reducedMotion: boolean; hideResults?: boolean }) {
  const { run, tried, state, bug } = evalState;
  const results = new Map(run.results.map((r) => [r.id, r]));
  const triedIds = new Map(tried.map((t) => [t.id, t]));
  const showInvalid = !!scene.refusals;

  const toneFor = (id: string): LabelTone => {
    const r = results.get(id) ?? triedIds.get(id);
    if (!r) return 'neutral';
    if (hideResults && results.has(id) && !triedIds.has(id)) return 'neutral';
    return r.passed ? 'good' : 'bad';
  };

  // The bug's arrow appears once anyone has taken it: a test or the learner.
  const bugTaken = (results.get('blocked:unfreeze') ?? triedIds.get('blocked:unfreeze'))?.actual === 'active' && !(hideResults && !triedIds.has('blocked:unfreeze'));

  const label = `Card state map. Your card is ${state}. ${run.metrics.tests} tests: ${run.metrics.validCovered} of 4 allowed moves and ${run.metrics.invalidCovered} of 5 refusals covered${hideResults ? ', results hidden' : `, ${run.metrics.failing} failing`}.`;

  return (
    <IsoScene bounds={BOUNDS} pad={[50, 90, 70, 110]} label={label} reducedMotion={reducedMotion} className="scene-svg">
      {(Object.keys(TILE) as CardState[]).map((s) => {
        const t = TILE[s];
        return (
          <g key={s} data-testid={`state-${s}`} data-current={s === state}>
            <IsoBox x={t.x} y={t.y} w={W} d={W} h={H} tone={t.tone} />
            <IsoText at={[t.x + W, t.y + W, 0]} dy={20}>{t.name}</IsoText>
          </g>
        );
      })}

      {ARROWS.map((a) => {
        const tone = toneFor(a.id);
        return (
          <g key={a.id} data-testid={`arrow-${a.id}`} data-result={tone}>
            <Pipe from={a.from} to={a.to} dots={0} tone={tone === 'bad' ? 'bad' : tone === 'good' ? 'good' : 'neutral'} />
            <Label at={a.mid} lift={a.id === 'frozen:unfreeze' ? -26 : 4} tone={tone === 'neutral' ? 'neutral' : tone} text={a.label} />
          </g>
        );
      })}

      {bugTaken && (
        <g data-testid="arrow-blocked:unfreeze" data-result="bad">
          <Pipe from={BUG_ARROW.from} to={BUG_ARROW.to} dots={reducedMotion ? 0 : 2} tone="bad" dotColor="#e07f7f" />
          <Label at={BUG_ARROW.mid} lift={-28} tone="bad" text="unfreeze ✕ should be refused" />
        </g>
      )}

      {/* Refusals: one gate per invalid transition, on its from-tile. */}
      {showInvalid &&
        INVALID_TRANSITIONS.map((t, i) => {
          const id = transitionId(t);
          const r = results.get(id) ?? triedIds.get(id);
          const hidden = hideResults && results.has(id) && !triedIds.has(id);
          const status = !r ? 'untested' : hidden ? 'hidden' : r.passed ? 'pass' : 'fail';
          const sameTile = INVALID_TRANSITIONS.filter((x) => x.from === t.from);
          const k = sameTile.findIndex((x) => transitionId(x) === id);
          const tone: LabelTone = status === 'pass' ? 'good' : status === 'fail' ? 'bad' : 'neutral';
          const mark = status === 'pass' ? '✓' : status === 'fail' ? '✕' : '?';
          return (
            <g key={id} data-testid={`refusal-${id}`} data-result={status} opacity={status === 'untested' ? 0.6 : 1}>
              <Label at={REFUSAL_ANCHOR[t.from]} lift={-k * 26} tone={tone} text={`${t.action}: refuse ${mark}`} />
            </g>
          );
        })}

      {/* Your card */}
      <g data-testid="your-card" data-state={state}>
        <IsoBox x={TILE[state].x + 2.6} y={TILE[state].y + 2.6} z={H} w={1.8} d={1.2} h={0.25} tone="butter" />
        <Label at={[TILE[state].x + 3.5, TILE[state].y + 3.2, H + 0.25]} lift={6} tone="you" text="your card" />
      </g>

      {scene.incident && bug && <Label at={[TILE.blocked.x + W, TILE.blocked.y + W, 0]} lift={-48} tone="bad" text="stolen card reactivated" />}
      {scene.ci && <Label at={[TILE.frozen.x + W / 2, TILE.frozen.y, H]} lift={20} tone="you" text="state table runs in CI" />}
    </IsoScene>
  );
}
