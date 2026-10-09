import type { Point } from "../../../types";
import {
  DRAG_DIRECTION_BASELINE,
  DRAG_DIRECTION_MIN_EPSILON,
} from "../../../shared/constants";

export interface UnitVector {
  x: number;
  y: number;
}

export function clamp01(t: number): number {
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

export function distanceBetween(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function pointsMatch(a: Point, b: Point, epsilon = 1e-6): boolean {
  return Math.abs(a.x - b.x) <= epsilon && Math.abs(a.y - b.y) <= epsilon;
}

export function lerpPoint(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

export function unitVector(dx: number, dy: number): UnitVector | null {
  const len = Math.hypot(dx, dy);
  if (len === 0) return null;
  return { x: dx / len, y: dy / len };
}

export function closestPointOnLineSegment(
  point: Point,
  a: Point,
  b: Point,
): Point {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return a;
  const t = clamp01(((point.x - a.x) * dx + (point.y - a.y) * dy) / lenSq);
  return { x: a.x + dx * t, y: a.y + dy * t };
}

export function distanceToPolyline(
  point: Point,
  polyline: readonly Point[],
): number {
  if (polyline.length === 0) return Number.POSITIVE_INFINITY;
  if (polyline.length === 1) return distanceBetween(point, polyline[0]);
  let minDistance = Number.POSITIVE_INFINITY;
  for (let i = 0; i < polyline.length - 1; i++) {
    const nearest = closestPointOnLineSegment(
      point,
      polyline[i],
      polyline[i + 1],
    );
    const d = distanceBetween(point, nearest);
    if (d < minDistance) minDistance = d;
  }
  return minDistance;
}

export function angleBetweenDegrees(a: UnitVector, b: UnitVector): number {
  const dot = a.x * b.x + a.y * b.y;
  const clamped = dot < -1 ? -1 : dot > 1 ? 1 : dot;
  return (Math.acos(clamped) * 180) / Math.PI;
}

// Walks backward from the newest sample until straight-line distance from `last` reaches
// `baselineDistance`; the chord over that distance is jitter-resistant but reacts quickly
// when the child genuinely turns. Falls back to the oldest sample if the total path is
// shorter than `baselineDistance`, provided the pair is farther apart than `minEpsilon`.
export function computeDragDirection(
  points: readonly Point[],
  baselineDistance: number = DRAG_DIRECTION_BASELINE,
  minEpsilon: number = DRAG_DIRECTION_MIN_EPSILON,
): UnitVector | null {
  if (points.length < 2) return null;
  const last = points[points.length - 1];
  for (let i = points.length - 2; i >= 0; i--) {
    const dx = last.x - points[i].x;
    const dy = last.y - points[i].y;
    const len = Math.hypot(dx, dy);
    if (len >= baselineDistance) return { x: dx / len, y: dy / len };
  }
  const anchor = points[0];
  const dx = last.x - anchor.x;
  const dy = last.y - anchor.y;
  const len = Math.hypot(dx, dy);
  if (len < minEpsilon) return null;
  return { x: dx / len, y: dy / len };
}
