import { createContext, useContext, useId, type ReactNode } from 'react';
import { INK, fitViewBox, fmt, palette, polygon, project, type IsoTone, type Point3 } from './projection';

const ScaleContext = createContext(1);
const ReducedMotionContext = createContext(false);
export const useScale = () => useContext(ScaleContext);

/** Root <svg> for an isometric scene. The viewBox is fitted to `bounds` so scenes don't jump between steps. */
export function IsoScene({
  bounds,
  pad,
  scale = 1,
  label,
  reducedMotion = false,
  className,
  children,
}: {
  bounds: readonly Point3[];
  pad?: readonly [number, number, number, number];
  scale?: number;
  label: string;
  reducedMotion?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <ScaleContext.Provider value={scale}>
      <ReducedMotionContext.Provider value={reducedMotion}>
        <svg viewBox={fitViewBox(bounds, pad, scale)} role="img" aria-label={label} className={className} style={{ display: 'block', width: '100%', height: 'auto' }}>
          {children}
        </svg>
      </ReducedMotionContext.Provider>
    </ScaleContext.Provider>
  );
}

const faceStyle = { stroke: INK, strokeWidth: 1.3, strokeLinejoin: 'round' as const };

/** A solid box: the building block of every 3D piece. */
export function IsoBox({
  x, y, z = 0, w, d, h, tone, className, testId,
}: {
  x: number; y: number; z?: number; w: number; d: number; h: number; tone: IsoTone; className?: string; testId?: string;
}) {
  const k = useScale();
  const [top, left, right] = palette[tone];
  return (
    <g className={className} data-testid={testId} data-tone={tone}>
      <polygon points={polygon([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]], k)} fill={left} {...faceStyle} />
      <polygon points={polygon([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]], k)} fill={right} {...faceStyle} />
      <polygon points={polygon([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]], k)} fill={top} {...faceStyle} />
    </g>
  );
}

/** Flat tinted quad on a box's top face (zones on a ruler). */
export function TopQuad({ x0, x1, y, d, z, tone }: { x0: number; x1: number; y: number; d: number; z: number; tone: IsoTone }) {
  const k = useScale();
  const [top, left] = palette[tone];
  return (
    <g data-tone={tone}>
      <polygon points={polygon([[x0, y, z], [x1, y, z], [x1, y + d, z], [x0, y + d, z]], k)} fill={top} {...faceStyle} />
      <polygon points={polygon([[x0, y + d, 0], [x1, y + d, 0], [x1, y + d, z], [x0, y + d, z]], k)} fill={left} {...faceStyle} />
    </g>
  );
}

export function Plate({ x, y, w, d }: { x: number; y: number; w: number; d: number }) {
  return <IsoBox x={x} y={y} w={w} d={d} h={0.25} tone="cream" />;
}

export type LabelTone = 'neutral' | 'good' | 'bad' | 'you' | 'hint';
const labelFill: Record<LabelTone, [string, string]> = {
  neutral: ['#fffdf8', INK],
  good: ['#dcefd0', INK],
  bad: ['#f9d6d6', '#8f1d17'],
  you: ['#e6ddfa', INK],
  hint: ['#fbe8b8', INK],
};

/** Width in px of a label chip for `text` (11.5px mono ≈ 6.95px per char). */
export const labelWidth = (text: string) => [...text].length * 6.95 + 18;

/** A readable chip anchored at a world point; its bottom edge sits `lift` px above it. */
export function Label({ at, text, tone = 'neutral', lift = 4, className, style }: { at: Point3; text: string; tone?: LabelTone; lift?: number; className?: string; style?: React.CSSProperties }) {
  const k = useScale();
  const [sx, sy] = project(at, k);
  const w = labelWidth(text);
  const [fill, color] = labelFill[tone];
  return (
    <g className={className} style={style} data-tone={tone}>
      <rect x={fmt(sx - w / 2)} y={fmt(sy - lift - 22)} width={fmt(w)} height={22} rx={6} fill={fill} stroke={INK} strokeWidth={1.3} />
      <text x={fmt(sx)} y={fmt(sy - lift - 7)} textAnchor="middle" fontSize={11.5} fontWeight={600} fill={color} fontFamily="inherit">
        {text}
      </text>
    </g>
  );
}

/** Plain text at a world point, offset `dy` px. */
export function IsoText({ at, dy = 0, dx = 0, size = 12.5, weight = 700, muted = false, anchor = 'middle', children }: { at: Point3; dy?: number; dx?: number; size?: number; weight?: number; muted?: boolean; anchor?: 'start' | 'middle' | 'end'; children: ReactNode }) {
  const k = useScale();
  const [sx, sy] = project(at, k);
  return (
    <text x={fmt(sx + dx)} y={fmt(sy + dy)} textAnchor={anchor} fontSize={size} fontWeight={weight} fill={muted ? '#6f685c' : INK} fontFamily="inherit" paintOrder="stroke" stroke="rgba(255,255,255,.6)" strokeWidth={3}>
      {children}
    </text>
  );
}

export type PipeTone = 'neutral' | 'good' | 'bad';
const pipeColor: Record<PipeTone, string> = { neutral: INK, good: '#4f8f3b', bad: '#c0392b' };

/** An arrow between two world points, with request dots travelling along it. */
export function Pipe({ from, to, tone = 'neutral', dots = 3, dotColor = '#ef9f55' }: { from: Point3; to: Point3; tone?: PipeTone; dots?: number; dotColor?: string }) {
  const k = useScale();
  const reduced = useContext(ReducedMotionContext);
  const [x1, y1] = project(from, k);
  const [x2, y2] = project(to, k);
  const d = `M${fmt(x1)} ${fmt(y1)} L${fmt(x2)} ${fmt(y2)}`;
  const a = Math.atan2(y2 - y1, x2 - x1);
  const hx = x2 - 9 * Math.cos(a);
  const hy = y2 - 9 * Math.sin(a);
  const head = `M${fmt(x2)} ${fmt(y2)} L${fmt(hx - 4 * Math.sin(a))} ${fmt(hy + 4 * Math.cos(a))} L${fmt(hx + 4 * Math.sin(a))} ${fmt(hy - 4 * Math.cos(a))}z`;
  const c = pipeColor[tone];
  return (
    <g data-testid="pipe" data-tone={tone}>
      <path d={d} fill="none" stroke={c} strokeWidth={1.6} strokeDasharray={tone === 'bad' ? '5 4' : undefined} />
      <path d={head} fill={c} />
      {Array.from({ length: dots }, (_, i) =>
        reduced ? (
          <circle key={i} cx={fmt(x1 + ((x2 - x1) * (i + 1)) / (dots + 1))} cy={fmt(y1 + ((y2 - y1) * (i + 1)) / (dots + 1))} r={4} fill={dotColor} stroke={INK} />
        ) : (
          <circle key={i} r={4} fill={dotColor} stroke={INK}>
            <animateMotion dur="1.8s" begin={`${((i * 1.8) / dots).toFixed(2)}s`} repeatCount="indefinite" path={d} />
          </circle>
        ),
      )}
    </g>
  );
}

export function Person({ at, color }: { at: Point3; color: string }) {
  const k = useScale();
  const [sx, sy] = project(at, k);
  return (
    <g>
      <rect x={fmt(sx - 5)} y={fmt(sy - 15)} width={10} height={15} rx={5} fill={color} stroke={INK} strokeWidth={1.3} />
      <circle cx={fmt(sx)} cy={fmt(sy - 20)} r={4.5} fill="#fffaf1" stroke={INK} strokeWidth={1.3} />
    </g>
  );
}

/** A server block on a plate, with a rack icon, a title on its front edge and an optional rule chip. */
export function Server({
  x, y, w = 4.5, d = 4.5, h = 3.1, tone = 'sky', title, rule, ruleTone = 'neutral',
}: {
  x: number; y: number; w?: number; d?: number; h?: number; tone?: IsoTone; title: string; rule?: string; ruleTone?: LabelTone;
}) {
  const k = useScale();
  const [ix, iy] = project([x + w, y + d, h / 2], k);
  return (
    <g data-testid={`server-${title.toLowerCase().replace(/\s+/g, '-')}`} data-tone={tone}>
      <Plate x={x - 0.7} y={y - 0.7} w={w + 1.4} d={d + 1.4} />
      <IsoBox x={x} y={y} w={w} d={d} h={h} tone={tone} />
      <g transform={`translate(${fmt(ix - 9)} ${fmt(iy - 28)})`}>
        <rect width={18} height={7} rx={2} fill="#fffaf1" stroke={INK} strokeWidth={1.2} />
        <rect y={9} width={18} height={7} rx={2} fill="#fffaf1" stroke={INK} strokeWidth={1.2} />
        <circle cx={4} cy={3.5} r={1.2} fill={INK} />
        <circle cx={4} cy={12.5} r={1.2} fill={INK} />
      </g>
      <IsoText at={[x + w, y + d, h / 2]} dy={6}>{title}</IsoText>
      {rule && <Label at={[x + w / 2, y + d / 2, h]} lift={8} text={rule} tone={ruleTone} />}
    </g>
  );
}

/** A small standalone 3D diagram: blocks in a horizontal row, each with a chip on top and a caption below. */
export type RowItem = { title: string; sub?: string; tone: IsoTone; height?: number; chip?: string; chipTone?: LabelTone };

export function BlockRow({ items, label, gap = 3.4 }: { items: readonly RowItem[]; label: string; gap?: number }) {
  const scale = 0.62;
  const bounds: Point3[] = items.flatMap((it, i) => {
    const x = i * gap, y = -i * gap, h = it.height ?? 1.4;
    return [[x, y, h + 2.6], [x + 3, y + 3, 0], [x + 3, y, 0], [x, y + 3, 0]] as Point3[];
  });
  return (
    <IsoScene bounds={bounds} pad={[14, 50, 40, 50]} scale={scale} label={label}>
      {items.map((it, i) => {
        const x = i * gap, y = -i * gap, h = it.height ?? 1.4;
        return (
          <g key={it.title}>
            <IsoBox x={x} y={y} w={3} d={3} h={h} tone={it.tone} />
            {it.chip && <Label at={[x + 1.5, y + 1.5, h]} lift={6} text={it.chip} tone={it.chipTone} />}
            <IsoText at={[x + 3, y + 3, 0]} dy={18}>{it.title}</IsoText>
            {it.sub && <IsoText at={[x + 3, y + 3, 0]} dy={33} size={11.5} weight={500} muted>{it.sub}</IsoText>}
          </g>
        );
      })}
    </IsoScene>
  );
}

/** Layers stacked into a pyramid, widest at the bottom, each labelled on the right. */
export function Pyramid({ layers, label }: { layers: readonly { title: string; tone: IsoTone }[]; label: string }) {
  const scale = 0.7;
  const k = scale;
  const bounds: Point3[] = [[0, 9, 0], [9, 0, 0], [9, 9, 0], [4, 4, 5]];
  return (
    <IsoScene bounds={bounds} pad={[16, 250, 16, 10]} scale={scale} label={label}>
      {layers.map((L, i) => {
        const s = 9 - 2.8 * i, q = 1.4 * i, z = i * 1.4;
        const [sx, sy] = project([q + s, q, z + 0.7], k);
        return (
          <g key={L.title}>
            <IsoBox x={q} y={q} z={z} w={s} d={s} h={1.4} tone={L.tone} />
            <line x1={fmt(sx + 4)} y1={fmt(sy)} x2={fmt(sx + 26)} y2={fmt(sy)} stroke={INK} strokeWidth={1.2} />
            <text x={fmt(sx + 32)} y={fmt(sy + 4)} fontSize={12} fontWeight={700} fill={INK} fontFamily="inherit">{L.title}</text>
          </g>
        );
      })}
    </IsoScene>
  );
}

/** Stable id helper for SVG defs inside pieces. */
export const useSvgId = () => useId().replace(/:/g, '');
