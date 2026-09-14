import type { LineSegment, Point } from "../../types";
import {
  DEFAULT_BOUNDARY_PADDING,
  DRAG_DIRECTION_BASELINE,
  DRAG_DIRECTION_MIN_EPSILON,
} from "../../shared/constants";

export interface UnitVector {
  x: number;
  y: number;
}

export interface BoundaryBox {
  cx: number;
  cy: number;
  halfLength: number;
  halfWidth: number;
  ux: number;
  uy: number;
  isDegenerate: boolean;
  curveSamples?: Point[];
}

const CURVE_CONTROL_X = 0.75;
const CURVE_SAMPLE_STEPS = 48;
const CURVE_PROGRESS_GAIN_FACTOR = 1.6;
const CURVE_PROGRESS_EPSILON_T = 0.004;

type OvalCurveSegment = LineSegment & {
  curveKind: "oval";
  ovalCenter: Point;
  ovalRadiusX: number;
  ovalRadiusY: number;
  ovalStartAngleDeg: number;
  ovalEndAngleDeg: number;
};

type PolylineCurveSegment = LineSegment & {
  curveKind: "polyline";
  polylinePoints: Point[];
};

function isOvalCurve(segment: LineSegment): segment is OvalCurveSegment {
  return (
    segment.curveKind === "oval" &&
    !!segment.ovalCenter &&
    typeof segment.ovalRadiusX === "number" &&
    typeof segment.ovalRadiusY === "number" &&
    typeof segment.ovalStartAngleDeg === "number" &&
    typeof segment.ovalEndAngleDeg === "number"
  );
}

function isPolylineCurve(
  segment: LineSegment,
): segment is PolylineCurveSegment {
  return (
    segment.curveKind === "polyline" &&
    Array.isArray(segment.polylinePoints) &&
    segment.polylinePoints.length >= 1
  );
}

function getPolylinePath(segment: LineSegment): Point[] {
  if (!isPolylineCurve(segment)) return [segment.start, segment.end];
  return [segment.start, ...segment.polylinePoints, segment.end];
}

function polylinePointAt(segment: LineSegment, t: number): Point {
  const points = getPolylinePath(segment);
  if (points.length === 0) return segment.start;
  if (points.length === 1) return points[0];

  const clampedT = t < 0 ? 0 : t > 1 ? 1 : t;
  const lengths: number[] = [];
  let totalLength = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const len = distanceBetween(points[i], points[i + 1]);
    lengths.push(len);
    totalLength += len;
  }

  if (totalLength === 0) return points[0];

  const targetLength = totalLength * clampedT;
  let walked = 0;
  for (let i = 0; i < lengths.length; i++) {
    const segLength = lengths[i];
    const nextWalked = walked + segLength;
    if (targetLength <= nextWalked || i === lengths.length - 1) {
      const localT = segLength === 0 ? 0 : (targetLength - walked) / segLength;
      return {
        x: points[i].x + (points[i + 1].x - points[i].x) * localT,
        y: points[i].y + (points[i + 1].y - points[i].y) * localT,
      };
    }
    walked = nextWalked;
  }

  return points[points.length - 1];
}

function getOvalSweepDeltaDeg(segment: LineSegment): number {
  if (!isOvalCurve(segment)) return 0;
  let delta = segment.ovalEndAngleDeg - segment.ovalStartAngleDeg;
  if (segment.ovalCounterClockwise ?? true) {
    while (delta <= 0) delta += 360;
  } else {
    while (delta >= 0) delta -= 360;
  }
  return delta;
}

function ovalPointAt(segment: LineSegment, t: number): Point {
  if (!isOvalCurve(segment)) return segment.start;
  const clampedT = t < 0 ? 0 : t > 1 ? 1 : t;
  const deltaDeg = getOvalSweepDeltaDeg(segment);
  const angleDeg = segment.ovalStartAngleDeg + deltaDeg * clampedT;
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: segment.ovalCenter.x + segment.ovalRadiusX * Math.cos(angleRad),
    y: segment.ovalCenter.y - segment.ovalRadiusY * Math.sin(angleRad),
  };
}

function getCurveControlX(segment: LineSegment): number {
  return segment.curveControlX ?? CURVE_CONTROL_X;
}

function cubicPoint(segment: LineSegment, t: number): Point {
  const mt = 1 - t;
  const cp1x = getCurveControlX(segment);
  const cp2x = getCurveControlX(segment);
  return {
    x:
      mt * mt * mt * segment.start.x +
      3 * mt * mt * t * cp1x +
      3 * mt * t * t * cp2x +
      t * t * t * segment.end.x,
    y:
      mt * mt * mt * segment.start.y +
      3 * mt * mt * t * segment.start.y +
      3 * mt * t * t * segment.end.y +
      t * t * t * segment.end.y,
  };
}

export function curvePointAt(segment: LineSegment, t: number): Point {
  if (isOvalCurve(segment)) return ovalPointAt(segment, t);
  if (isPolylineCurve(segment)) return polylinePointAt(segment, t);
  return cubicPoint(segment, t);
}

function sampleCurve(
  segment: LineSegment,
  steps = CURVE_SAMPLE_STEPS,
): Point[] {
  const points: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    points.push(curvePointAt(segment, i / steps));
  }
  return points;
}

function closestPointOnLineSegment(point: Point, a: Point, b: Point): Point {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return a;
  const t = ((point.x - a.x) * dx + (point.y - a.y) * dy) / lenSq;
  const clamped = t < 0 ? 0 : t > 1 ? 1 : t;
  return { x: a.x + dx * clamped, y: a.y + dy * clamped };
}

function distanceToPolyline(point: Point, polyline: readonly Point[]): number {
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

function projectPointOntoCurve(
  point: Point,
  segment: LineSegment,
  steps = CURVE_SAMPLE_STEPS,
): number {
  const samples = sampleCurve(segment, steps);
  let minDistSq = Number.POSITIVE_INFINITY;
  let bestT = 0;
  for (let i = 0; i < samples.length - 1; i++) {
    const a = samples[i];
    const b = samples[i + 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    const localT =
      lenSq === 0
        ? 0
        : Math.max(
            0,
            Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lenSq),
          );
    const projX = a.x + dx * localT;
    const projY = a.y + dy * localT;
    const ddx = point.x - projX;
    const ddy = point.y - projY;
    const distSq = ddx * ddx + ddy * ddy;
    if (distSq < minDistSq) {
      minDistSq = distSq;
      const t0 = i / steps;
      const t1 = (i + 1) / steps;
      bestT = t0 + (t1 - t0) * localT;
    }
  }
  return bestT;
}

export function getSegmentPadding(segment: LineSegment): number {
  return segment.boundaryHalfWidth ?? DEFAULT_BOUNDARY_PADDING;
}

export function segmentLength(segment: LineSegment): number {
  const dx = segment.end.x - segment.start.x;
  const dy = segment.end.y - segment.start.y;
  return Math.hypot(dx, dy);
}

export function isDegenerate(segment: LineSegment): boolean {
  return segmentLength(segment) === 0;
}

export function computeBoundaryBox(
  segment: LineSegment,
  padding: number = getSegmentPadding(segment),
): BoundaryBox {
  if (segment.isCurve) {
    const curveSamples = sampleCurve(segment);
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    for (const p of curveSamples) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    return {
      cx: (minX + maxX) / 2,
      cy: (minY + maxY) / 2,
      halfLength: (maxX - minX) / 2 + padding,
      halfWidth: padding,
      ux: 1,
      uy: 0,
      isDegenerate: false,
      curveSamples,
    };
  }

  const dx = segment.end.x - segment.start.x;
  const dy = segment.end.y - segment.start.y;
  const length = Math.hypot(dx, dy);
  if (length === 0) {
    return {
      cx: segment.start.x,
      cy: segment.start.y,
      halfLength: padding,
      halfWidth: padding,
      ux: 1,
      uy: 0,
      isDegenerate: true,
    };
  }
  return {
    cx: (segment.start.x + segment.end.x) / 2,
    cy: (segment.start.y + segment.end.y) / 2,
    halfLength: length / 2 + padding,
    halfWidth: padding,
    ux: dx / length,
    uy: dy / length,
    isDegenerate: false,
  };
}

export function isPointInBox(point: Point, box: BoundaryBox): boolean {
  if (box.curveSamples) {
    return distanceToPolyline(point, box.curveSamples) <= box.halfWidth;
  }
  const relX = point.x - box.cx;
  const relY = point.y - box.cy;
  const along = relX * box.ux + relY * box.uy;
  const across = relX * -box.uy + relY * box.ux;
  return Math.abs(along) <= box.halfLength && Math.abs(across) <= box.halfWidth;
}

export function projectPointOntoSegment(
  point: Point,
  segment: LineSegment,
): number {
  if (segment.isCurve) {
    return projectPointOntoCurve(point, segment);
  }
  const dx = segment.end.x - segment.start.x;
  const dy = segment.end.y - segment.start.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return 0;
  const t =
    ((point.x - segment.start.x) * dx + (point.y - segment.start.y) * dy) /
    lenSq;
  if (t < 0) return 0;
  if (t > 1) return 1;
  return t;
}

export function computeCoverage(
  points: readonly Point[],
  segment: LineSegment,
): number {
  if (points.length === 0 || isDegenerate(segment)) return 0;

  if (segment.isCurve) {
    // For curves, nearest-point projection can jump between seam-adjacent parameters
    // (e.g. oval start/end near the same location). Gate parameter gain by observed
    // pointer travel distance so tapping near both markers cannot fake full progress.
    const samples = sampleCurve(segment);
    let curveLength = 0;
    for (let i = 1; i < samples.length; i++) {
      curveLength += distanceBetween(samples[i - 1], samples[i]);
    }
    if (curveLength <= 0) return 0;

    let coverage = 0;
    let prevPoint = points[0];
    let prevT = projectPointOntoSegment(prevPoint, segment);

    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      const t = projectPointOntoSegment(point, segment);
      const rawDeltaT = t - prevT;

      if (rawDeltaT > 0) {
        const moveDistance = distanceBetween(prevPoint, point);
        const maxDeltaTFromMotion =
          (moveDistance / curveLength) * CURVE_PROGRESS_GAIN_FACTOR +
          CURVE_PROGRESS_EPSILON_T;
        coverage += Math.min(rawDeltaT, maxDeltaTFromMotion);
        if (coverage >= 1) return 1;
      }

      prevPoint = point;
      prevT = t;
    }

    return coverage;
  }

  let maxT = 0;
  for (const p of points) {
    const t = projectPointOntoSegment(p, segment);
    if (t > maxT) maxT = t;
  }
  return maxT;
}

export function distanceBetween(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function segmentDirection(segment: LineSegment): UnitVector | null {
  if (segment.isCurve) return null;
  const dx = segment.end.x - segment.start.x;
  const dy = segment.end.y - segment.start.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return null;
  return { x: dx / len, y: dy / len };
}

export function segmentTangentAt(
  segment: LineSegment,
  t: number,
): UnitVector | null {
  if (!segment.isCurve) return segmentDirection(segment);
  if (isPolylineCurve(segment)) {
    const points = getPolylinePath(segment);
    if (points.length < 2) return null;

    const clampedT = t < 0 ? 0 : t > 1 ? 1 : t;
    const lengths: number[] = [];
    let totalLength = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const len = distanceBetween(points[i], points[i + 1]);
      lengths.push(len);
      totalLength += len;
    }
    if (totalLength === 0) return null;

    const targetLength = totalLength * clampedT;
    let walked = 0;
    for (let i = 0; i < lengths.length; i++) {
      const segLength = lengths[i];
      if (segLength === 0) continue;
      const nextWalked = walked + segLength;
      if (targetLength <= nextWalked || i === lengths.length - 1) {
        const dx = points[i + 1].x - points[i].x;
        const dy = points[i + 1].y - points[i].y;
        const len = Math.hypot(dx, dy);
        if (len === 0) return null;
        return { x: dx / len, y: dy / len };
      }
      walked = nextWalked;
    }
    return null;
  }
  if (isOvalCurve(segment)) {
    const clampedT = t < 0 ? 0 : t > 1 ? 1 : t;
    const deltaDeg = getOvalSweepDeltaDeg(segment);
    const angleDeg = segment.ovalStartAngleDeg + deltaDeg * clampedT;
    const angleRad = (angleDeg * Math.PI) / 180;
    const deltaRad = (deltaDeg * Math.PI) / 180;
    const tx = -segment.ovalRadiusX * Math.sin(angleRad) * deltaRad;
    const ty = -segment.ovalRadiusY * Math.cos(angleRad) * deltaRad;
    const len = Math.hypot(tx, ty);
    if (len === 0) return null;
    return { x: tx / len, y: ty / len };
  }
  const clampedT = t < 0 ? 0 : t > 1 ? 1 : t;
  const mt = 1 - clampedT;
  const cp1x = getCurveControlX(segment);
  const cp2x = getCurveControlX(segment);

  const tx =
    3 * mt * mt * (cp1x - segment.start.x) +
    6 * mt * clampedT * (cp2x - cp1x) +
    3 * clampedT * clampedT * (segment.end.x - cp2x);
  const ty = 6 * mt * clampedT * (segment.end.y - segment.start.y);
  const len = Math.hypot(tx, ty);
  if (len === 0) return null;
  return { x: tx / len, y: ty / len };
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

export function angleBetweenDegrees(a: UnitVector, b: UnitVector): number {
  const dot = a.x * b.x + a.y * b.y;
  const clamped = dot < -1 ? -1 : dot > 1 ? 1 : dot;
  return (Math.acos(clamped) * 180) / Math.PI;
}
