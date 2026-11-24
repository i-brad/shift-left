/** Isometric projection: 30° axes, one world unit = UNIT px at scale 1. */
export const UNIT = 20;
const COS = Math.cos(Math.PI / 6) * UNIT;
const HALF = UNIT / 2;

export type Point3 = readonly [x: number, y: number, z?: number];
export type Point2 = [sx: number, sy: number];

export function project([x, y, z = 0]: Point3, scale = 1): Point2 {
  return [(x - y) * COS * scale, ((x + y) * HALF - z * UNIT) * scale];
}

export const fmt = (n: number) => (Math.round(n * 10) / 10).toString();

export function polygon(points: readonly Point3[], scale = 1): string {
  return points.map((p) => project(p, scale).map(fmt).join(',')).join(' ');
}

/** viewBox string covering the given world points, with [top, right, bottom, left] padding in px. */
export function fitViewBox(points: readonly Point3[], pad: readonly [number, number, number, number] = [24, 24, 24, 24], scale = 1): string {
  const pts = points.map((p) => project(p, scale));
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs) - pad[3];
  const y0 = Math.min(...ys) - pad[0];
  const w = Math.max(...xs) + pad[1] - x0;
  const h = Math.max(...ys) + pad[2] - y0;
  return [x0, y0, w, h].map(fmt).join(' ');
}

export type IsoTone = 'lavender' | 'sky' | 'rose' | 'sage' | 'cream' | 'pink' | 'butter';

/** [top, left (+y) face, right (+x) face] — one light source from the top. */
export const palette: Record<IsoTone, readonly [string, string, string]> = {
  lavender: ['#ece5fc', '#cdbff3', '#a993e8'],
  sky: ['#e3eefc', '#b9d0f3', '#8fb0e6'],
  rose: ['#fbdada', '#f1adad', '#e08484'],
  sage: ['#e3f2dc', '#c0e0b4', '#98c98b'],
  cream: ['#fffaf1', '#ece3d2', '#d8cbb2'],
  pink: ['#fbe0e5', '#f3bcc7', '#e597a7'],
  butter: ['#fdf0cc', '#f6db93', '#e9c46a'],
};

export const INK = '#1f1e1b';
