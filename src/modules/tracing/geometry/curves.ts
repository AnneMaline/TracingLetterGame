import type {
  LineSegment,
  LineValues,
  Point,
  PolylinePoint,
} from "../../../types";
import { isOvalCurve, ovalPointAt, ovalTangentAt } from "./oval";
import { stadiumPointAt, stadiumTangentAt } from "./stadium";
import {
  clamp01,
  distanceBetween,
  lerpPoint,
  pointsMatch,
  type UnitVector,
  unitVector,
} from "./vector";

// Curve models (see docs/adr/0001-curve-models-and-coverage.md):
//   - straight: no curve fields
//   - stadium:  `isCurve` without `curveKind` (arm -> semicircle -> arm), bulge set by `curveControlX`
//   - oval:     `curveKind: "oval"` elliptical arc, possibly a full closed loop
//   - polyline: `curveKind: "polyline"` chain of straight/stadium/oval sub-steps traced as one stroke

export const CURVE_SAMPLE_STEPS = 48;

type PolylineCurveSegment = LineSegment & {
  curveKind: "polyline";
  polylinePoints: PolylinePoint[];
};

export interface PolylinePath {
  segments: LineSegment[];
  lengths: number[];
  totalLength: number;
}

// Authored segments are immutable data, so derived geometry is cached per segment object.
const sampleCache = new WeakMap<LineSegment, readonly Point[]>();
const polylineCache = new WeakMap<LineSegment, PolylinePath>();

export function isCurvedSegment(segment: LineSegment): boolean {
  return (
    segment.isCurve === true ||
    segment.curveKind === "oval" ||
    segment.curveKind === "polyline"
  );
}

export function isPolylineCurve(
  segment: LineSegment,
): segment is PolylineCurveSegment {
  return (
    segment.curveKind === "polyline" &&
    Array.isArray(segment.polylinePoints) &&
    segment.polylinePoints.length >= 1
  );
}

function isSubSegmentStep(step: PolylinePoint): step is LineValues {
  return "start" in step && "end" in step;
}

function polylineSubSegments(segment: PolylineCurveSegment): LineSegment[] {
  const subSegments: LineSegment[] = [];
  let cursor = segment.start;

  for (const step of segment.polylinePoints) {
    if (!isSubSegmentStep(step)) {
      if (!pointsMatch(cursor, step)) {
        subSegments.push({ start: cursor, end: step });
      }
      cursor = step;
      continue;
    }

    if (!pointsMatch(cursor, step.start)) {
      subSegments.push({ start: cursor, end: step.start });
    }
    // Sub-steps may omit curveKind; infer it so sub-step ovals trace as ovals, not stadiums.
    const subSegment: LineSegment = { ...step };
    if (subSegment.curveKind === undefined && subSegment.ovalCenter) {
      subSegment.curveKind = "oval";
    }
    subSegments.push(subSegment);
    cursor = step.end;
  }

  if (!pointsMatch(cursor, segment.end)) {
    subSegments.push({ start: cursor, end: segment.end });
  }

  return subSegments.length > 0
    ? subSegments
    : [{ start: segment.start, end: segment.end }];
}

export function curveLength(segment: LineSegment): number {
  if (!isCurvedSegment(segment)) {
    return distanceBetween(segment.start, segment.end);
  }
  const samples = sampleCurve(segment);
  let length = 0;
  for (let i = 1; i < samples.length; i++) {
    length += distanceBetween(samples[i - 1], samples[i]);
  }
  return length;
}

export function getPolylinePath(segment: PolylineCurveSegment): PolylinePath {
  const cached = polylineCache.get(segment);
  if (cached) return cached;

  const segments = polylineSubSegments(segment);
  const lengths = segments.map(curveLength);
  const path: PolylinePath = {
    segments,
    lengths,
    totalLength: lengths.reduce((sum, len) => sum + len, 0),
  };
  polylineCache.set(segment, path);
  return path;
}

export function subSegmentIndexAtT(path: PolylinePath, t: number): number {
  if (path.segments.length <= 1 || path.totalLength <= 0) return 0;
  const target = clamp01(t) * path.totalLength;
  let walked = 0;
  for (let i = 0; i < path.lengths.length; i++) {
    walked += path.lengths[i];
    if (target <= walked) return i;
  }
  return path.segments.length - 1;
}

// Maps polyline progress t to (sub-segment, local t) by arc length.
function locateOnPolyline(
  path: PolylinePath,
  t: number,
): { subSegment: LineSegment; localT: number } {
  const targetLength = path.totalLength * clamp01(t);
  let walked = 0;
  for (let i = 0; i < path.lengths.length; i++) {
    const segLength = path.lengths[i];
    const nextWalked = walked + segLength;
    if (targetLength <= nextWalked || i === path.lengths.length - 1) {
      const localT = segLength === 0 ? 0 : (targetLength - walked) / segLength;
      return { subSegment: path.segments[i], localT };
    }
    walked = nextWalked;
  }
  const last = path.segments[path.segments.length - 1];
  return { subSegment: last, localT: 1 };
}

function polylinePointAt(segment: PolylineCurveSegment, t: number): Point {
  const path = getPolylinePath(segment);
  if (path.totalLength === 0) return path.segments[0].start;
  const { subSegment, localT } = locateOnPolyline(path, t);
  return isCurvedSegment(subSegment)
    ? curvePointAt(subSegment, localT)
    : lerpPoint(subSegment.start, subSegment.end, localT);
}

export function curvePointAt(segment: LineSegment, t: number): Point {
  if (isOvalCurve(segment)) return ovalPointAt(segment, t);
  if (isPolylineCurve(segment)) return polylinePointAt(segment, t);
  return stadiumPointAt(segment, t);
}

export function sampleCurve(segment: LineSegment): readonly Point[] {
  const cached = sampleCache.get(segment);
  if (cached) return cached;
  const points: Point[] = [];
  for (let i = 0; i <= CURVE_SAMPLE_STEPS; i++) {
    points.push(curvePointAt(segment, i / CURVE_SAMPLE_STEPS));
  }
  sampleCache.set(segment, points);
  return points;
}

export function segmentDirection(segment: LineSegment): UnitVector | null {
  if (isCurvedSegment(segment)) return null;
  return unitVector(
    segment.end.x - segment.start.x,
    segment.end.y - segment.start.y,
  );
}

export function segmentTangentAt(
  segment: LineSegment,
  t: number,
): UnitVector | null {
  if (!isCurvedSegment(segment)) return segmentDirection(segment);
  if (isPolylineCurve(segment)) {
    const path = getPolylinePath(segment);
    if (path.totalLength === 0) return null;
    const { subSegment, localT } = locateOnPolyline(path, t);
    return segmentTangentAt(subSegment, localT);
  }
  if (isOvalCurve(segment)) return ovalTangentAt(segment, t);
  return stadiumTangentAt(segment, t);
}
