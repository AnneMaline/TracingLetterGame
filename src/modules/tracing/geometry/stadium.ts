import type { LineSegment, Point } from "../../../types";
import { clamp01, type UnitVector } from "./vector";

// Default x of the far side of the bulge when a stadium curve omits `curveControlX`.
export const DEFAULT_CURVE_CONTROL_X = 0.75;

interface StadiumParams {
  sx: number;
  sy: number;
  ey: number;
  outward: 1 | -1;
  vertical: 1 | -1;
  radius: number;
  arcCenterX: number;
  arcCenterY: number;
  flatLength: number;
  arcLength: number;
  totalLength: number;
}

// Composite path: straight arm from start -> semicircular bulge -> straight arm to end.
// Gives longer near-parallel sections at the endpoints and a blunt round on the far side,
// instead of a plain cubic Bezier that curves sharply right away.
function stadiumParams(segment: LineSegment): StadiumParams {
  const sx = segment.start.x;
  const sy = segment.start.y;
  const ey = segment.end.y;
  const cx = segment.curveControlX ?? DEFAULT_CURVE_CONTROL_X;
  const outward: 1 | -1 = cx >= sx ? 1 : -1;
  const radius = Math.abs(ey - sy) / 2;
  const arcCenterX = cx - outward * radius;
  const rawFlat = outward * (arcCenterX - sx);
  const flatLength = rawFlat > 0 ? rawFlat : 0;
  const arcLength = Math.PI * radius;
  return {
    sx,
    sy,
    ey,
    outward,
    vertical: ey >= sy ? 1 : -1,
    radius,
    arcCenterX,
    arcCenterY: (sy + ey) / 2,
    flatLength,
    arcLength,
    totalLength: 2 * flatLength + arcLength,
  };
}

export function stadiumPointAt(segment: LineSegment, t: number): Point {
  const p = stadiumParams(segment);
  if (p.totalLength === 0) return { x: p.sx, y: p.sy };
  const s = clamp01(t) * p.totalLength;

  if (s <= p.flatLength) return { x: p.sx + p.outward * s, y: p.sy };
  const afterTop = s - p.flatLength;
  if (afterTop <= p.arcLength) {
    const theta = Math.PI * (p.arcLength === 0 ? 0 : afterTop / p.arcLength);
    return {
      x: p.arcCenterX + p.outward * p.radius * Math.sin(theta),
      y: p.arcCenterY - p.vertical * p.radius * Math.cos(theta),
    };
  }
  const afterArc = afterTop - p.arcLength;
  return { x: p.arcCenterX - p.outward * afterArc, y: p.ey };
}

export function stadiumTangentAt(
  segment: LineSegment,
  t: number,
): UnitVector | null {
  const p = stadiumParams(segment);
  if (p.totalLength === 0) return null;
  const s = clamp01(t) * p.totalLength;

  if (s <= p.flatLength) return { x: p.outward, y: 0 };
  const afterTop = s - p.flatLength;
  if (afterTop <= p.arcLength) {
    const theta = Math.PI * (p.arcLength === 0 ? 0 : afterTop / p.arcLength);
    const tx = p.outward * Math.cos(theta);
    const ty = p.vertical * Math.sin(theta);
    const len = Math.hypot(tx, ty);
    if (len === 0) return null;
    return { x: tx / len, y: ty / len };
  }
  return { x: -p.outward, y: 0 };
}

// Exact SVG equivalent (lines + elliptical arc) of the sampled stadium path above.
export function stadiumSvgPath(segment: LineSegment): string {
  const { sx, sy, ey, outward, radius, flatLength } = stadiumParams(segment);
  const armEndX = sx + outward * flatLength;
  const sweepFlag = ey > sy === outward > 0 ? 1 : 0;
  return (
    `M ${sx} ${sy} L ${armEndX} ${sy} ` +
    `A ${radius} ${radius} 0 0 ${sweepFlag} ${armEndX} ${ey} ` +
    `L ${sx} ${ey}`
  );
}
