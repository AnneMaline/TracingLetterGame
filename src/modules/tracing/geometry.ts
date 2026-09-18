import type {
  LineSegment,
  Point,
  PolylinePoint,
  PolylineSubSegment,
} from "../../types";
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
  polylinePoints: PolylinePoint[];
};

interface PolylinePathData {
  segments: LineSegment[];
  lengths: number[];
  totalLength: number;
}

interface PolylineCornerData {
  progresses: number[];
  points: Point[];
  totalLength: number;
}

export function isCurvedSegment(segment: LineSegment): boolean {
  return (
    segment.isCurve === true ||
    segment.curveKind === "oval" ||
    segment.curveKind === "polyline"
  );
}

function isPointStep(step: PolylinePoint): step is Point {
  return "x" in step && "y" in step;
}

function isSubSegmentStep(step: PolylinePoint): step is PolylineSubSegment {
  return "start" in step && "end" in step;
}

function pointsMatch(a: Point, b: Point, epsilon = 1e-6): boolean {
  return Math.abs(a.x - b.x) <= epsilon && Math.abs(a.y - b.y) <= epsilon;
}

function lerpPoint(a: Point, b: Point, t: number): Point {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
}

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

function getPolylineSubSegments(segment: LineSegment): LineSegment[] {
  if (!isPolylineCurve(segment))
    return [{ start: segment.start, end: segment.end }];

  const subSegments: LineSegment[] = [];
  let cursor = segment.start;

  for (const step of segment.polylinePoints) {
    if (isPointStep(step)) {
      if (!pointsMatch(cursor, step)) {
        subSegments.push({ start: cursor, end: step });
      }
      cursor = step;
      continue;
    }

    if (isSubSegmentStep(step)) {
      if (!pointsMatch(cursor, step.start)) {
        subSegments.push({ start: cursor, end: step.start });
      }
      subSegments.push({ ...step });
      cursor = step.end;
    }
  }

  if (!pointsMatch(cursor, segment.end)) {
    subSegments.push({ start: cursor, end: segment.end });
  }

  if (subSegments.length === 0) {
    return [{ start: segment.start, end: segment.end }];
  }

  return subSegments;
}

function segmentPathLength(segment: LineSegment): number {
  if (!isCurvedSegment(segment))
    return distanceBetween(segment.start, segment.end);

  const curveSamples = sampleCurve(segment);
  let length = 0;
  for (let i = 1; i < curveSamples.length; i++) {
    length += distanceBetween(curveSamples[i - 1], curveSamples[i]);
  }
  return length;
}

function getPolylinePathData(segment: LineSegment): PolylinePathData {
  const segments = getPolylineSubSegments(segment);
  const lengths: number[] = [];
  let totalLength = 0;

  for (const subSegment of segments) {
    const len = segmentPathLength(subSegment);
    lengths.push(len);
    totalLength += len;
  }

  return { segments, lengths, totalLength };
}

function getPolylineCornerData(
  segment: LineSegment,
): PolylineCornerData | null {
  if (!isPolylineCurve(segment)) return null;
  const path = getPolylinePathData(segment);
  if (path.totalLength <= 0 || path.lengths.length <= 1) return null;

  const progresses: number[] = [];
  const points: Point[] = [];
  let walked = 0;
  for (let i = 0; i < path.lengths.length - 1; i++) {
    walked += path.lengths[i];
    progresses.push(walked / path.totalLength);
    points.push(path.segments[i].end);
  }

  return { progresses, points, totalLength: path.totalLength };
}

// Multiplier applied to the segment padding to produce the corner turning window.
// Slightly larger than a single padding radius so children can "cut" or overshoot the
// exact turn point by a small amount without triggering deviation resets.
const POLYLINE_CORNER_RADIUS_FACTOR = 1.5;

function subSegmentIndexAtT(path: PolylinePathData, t: number): number {
  if (path.segments.length <= 1 || path.totalLength <= 0) return 0;
  const target = Math.max(0, Math.min(1, t)) * path.totalLength;
  let walked = 0;
  for (let i = 0; i < path.lengths.length; i++) {
    walked += path.lengths[i];
    if (target <= walked) return i;
  }
  return path.segments.length - 1;
}

function distanceFromPointToSubSegment(
  point: Point,
  subSegment: LineSegment,
): number {
  if (isCurvedSegment(subSegment)) {
    const samples = sampleCurve(subSegment);
    return distanceToPolyline(point, samples);
  }
  const nearest = closestPointOnLineSegment(
    point,
    subSegment.start,
    subSegment.end,
  );
  return distanceBetween(point, nearest);
}

// Nearest distance from `tail` to any sub-segment other than the one it currently sits on.
// Small values (<= overlap radius) mean the polyline has another branch running through the
// same area — direction/backtrack checks are ambiguous here (e.g. hard-mode B's two bumps
// sharing the horizontal arm at y=0.5) and should be relaxed.
function distanceToOtherPolylineBranches(
  segment: LineSegment,
  tail: Point,
  tailT: number,
): number {
  if (!isPolylineCurve(segment)) return Number.POSITIVE_INFINITY;
  const path = getPolylinePathData(segment);
  if (path.segments.length < 2) return Number.POSITIVE_INFINITY;
  const currentSubIndex = subSegmentIndexAtT(path, tailT);

  let minDist = Number.POSITIVE_INFINITY;
  for (let i = 0; i < path.segments.length; i++) {
    if (i === currentSubIndex) continue;
    const d = distanceFromPointToSubSegment(tail, path.segments[i]);
    if (d < minDist) minDist = d;
  }
  return minDist;
}

export function shouldSuppressDeviationAtPolylineCorner(
  segment: LineSegment,
  prevT: number,
  tailT: number,
  tailPoint: Point,
  baselineDistance: number,
): boolean {
  if (!isPolylineCurve(segment)) return false;

  const padding = getSegmentPadding(segment);
  const cornerRadius = padding * POLYLINE_CORNER_RADIUS_FACTOR;
  const cornerWindowDistance = Math.max(baselineDistance, cornerRadius);
  const cornerSpatialWindow = cornerRadius + baselineDistance;
  const overlapRadius = padding;

  // Self-overlap zones (e.g. hard-mode B's shared arm at y=0.5): if the tail is spatially
  // near a non-current branch of the polyline, direction and backtrack checks are ambiguous.
  if (
    distanceToOtherPolylineBranches(segment, tailPoint, tailT) <= overlapRadius
  ) {
    return true;
  }

  const corners = getPolylineCornerData(segment);
  if (!corners) return false;

  for (let i = 0; i < corners.progresses.length; i++) {
    const cornerT = corners.progresses[i];
    const cornerPoint = corners.points[i];
    const crossedCorner = prevT <= cornerT && tailT >= cornerT;
    const distancePastCorner = (tailT - cornerT) * corners.totalLength;
    const stillWithinDirectionWindow =
      tailT >= cornerT && distancePastCorner <= baselineDistance;
    const tailDistanceToCornerOnPath =
      Math.abs(tailT - cornerT) * corners.totalLength;
    const prevDistanceToCornerOnPath =
      Math.abs(prevT - cornerT) * corners.totalLength;
    const stillNearCornerOnPath =
      Math.min(tailDistanceToCornerOnPath, prevDistanceToCornerOnPath) <=
      cornerWindowDistance;
    const stillWithinCornerBoundary =
      distanceBetween(tailPoint, cornerPoint) <= cornerRadius;
    const stillWithinCornerSpatialWindow =
      distanceBetween(tailPoint, cornerPoint) <= cornerSpatialWindow;
    if (
      crossedCorner ||
      stillWithinDirectionWindow ||
      stillNearCornerOnPath ||
      stillWithinCornerBoundary ||
      stillWithinCornerSpatialWindow
    ) {
      return true;
    }
  }

  return false;
}

function polylinePointAt(segment: LineSegment, t: number): Point {
  const path = getPolylinePathData(segment);
  if (path.segments.length === 0) return segment.start;

  const clampedT = t < 0 ? 0 : t > 1 ? 1 : t;
  if (path.totalLength === 0) return path.segments[0].start;

  const targetLength = path.totalLength * clampedT;
  let walked = 0;
  for (let i = 0; i < path.lengths.length; i++) {
    const segLength = path.lengths[i];
    const nextWalked = walked + segLength;
    const subSegment = path.segments[i];
    if (targetLength <= nextWalked || i === path.lengths.length - 1) {
      const localT = segLength === 0 ? 0 : (targetLength - walked) / segLength;
      return isCurvedSegment(subSegment)
        ? curvePointAt(subSegment, localT)
        : lerpPoint(subSegment.start, subSegment.end, localT);
    }
    walked = nextWalked;
  }

  return path.segments[path.segments.length - 1].end;
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

interface StadiumParams {
  sx: number;
  sy: number;
  ey: number;
  outward: 1 | -1;
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
function getStadiumParams(segment: LineSegment): StadiumParams {
  const sx = segment.start.x;
  const sy = segment.start.y;
  const ey = segment.end.y;
  const cx = getCurveControlX(segment);
  const outward: 1 | -1 = cx >= sx ? 1 : -1;
  const height = Math.abs(ey - sy);
  const radius = height / 2;
  const arcCenterX = cx - outward * radius;
  const arcCenterY = (sy + ey) / 2;
  const rawFlat = outward * (arcCenterX - sx);
  const flatLength = rawFlat > 0 ? rawFlat : 0;
  const arcLength = Math.PI * radius;
  return {
    sx,
    sy,
    ey,
    outward,
    radius,
    arcCenterX,
    arcCenterY,
    flatLength,
    arcLength,
    totalLength: 2 * flatLength + arcLength,
  };
}

function stadiumPointAt(segment: LineSegment, t: number): Point {
  const p = getStadiumParams(segment);
  if (p.totalLength === 0) return { x: p.sx, y: p.sy };
  const clampedT = t < 0 ? 0 : t > 1 ? 1 : t;
  const s = clampedT * p.totalLength;
  const vertical = p.ey >= p.sy ? 1 : -1;

  if (s <= p.flatLength) {
    return { x: p.sx + p.outward * s, y: p.sy };
  }
  const afterTop = s - p.flatLength;
  if (afterTop <= p.arcLength) {
    const alpha = p.arcLength === 0 ? 0 : afterTop / p.arcLength;
    const theta = Math.PI * alpha;
    return {
      x: p.arcCenterX + p.outward * p.radius * Math.sin(theta),
      y: p.arcCenterY - vertical * p.radius * Math.cos(theta),
    };
  }
  const afterArc = afterTop - p.arcLength;
  return { x: p.arcCenterX - p.outward * afterArc, y: p.ey };
}

function stadiumTangentAt(segment: LineSegment, t: number): UnitVector | null {
  const p = getStadiumParams(segment);
  if (p.totalLength === 0) return null;
  const clampedT = t < 0 ? 0 : t > 1 ? 1 : t;
  const s = clampedT * p.totalLength;
  const vertical = p.ey >= p.sy ? 1 : -1;

  if (s <= p.flatLength) return { x: p.outward, y: 0 };
  const afterTop = s - p.flatLength;
  if (afterTop <= p.arcLength) {
    const alpha = p.arcLength === 0 ? 0 : afterTop / p.arcLength;
    const theta = Math.PI * alpha;
    const tx = p.outward * Math.cos(theta);
    const ty = vertical * Math.sin(theta);
    const len = Math.hypot(tx, ty);
    if (len === 0) return null;
    return { x: tx / len, y: ty / len };
  }
  return { x: -p.outward, y: 0 };
}

export function curvePointAt(segment: LineSegment, t: number): Point {
  if (isOvalCurve(segment)) return ovalPointAt(segment, t);
  if (isPolylineCurve(segment)) return polylinePointAt(segment, t);
  return stadiumPointAt(segment, t);
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

// `hintT`: prior progress along the curve. On self-overlapping polylines (e.g. hard B's
// two bumps sharing a horizontal arm at y=0.5) multiple branches project to the same
// distance; without a hint the first-seen branch wins and later samples appear to jump
// backward. When two candidates are within `PROJECT_TIE_EPSILON_SQ` of the minimum distance,
// prefer the one whose t is closest to `hintT`; if still tied, prefer the larger (forward) t.
const PROJECT_TIE_EPSILON_SQ = 1e-8;

function projectPointOntoCurve(
  point: Point,
  segment: LineSegment,
  steps = CURVE_SAMPLE_STEPS,
  hintT?: number,
): number {
  const samples = sampleCurve(segment, steps);
  let minDistSq = Number.POSITIVE_INFINITY;
  let bestT = 0;
  let bestHintDelta = Number.POSITIVE_INFINITY;
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
    const t0 = i / steps;
    const t1 = (i + 1) / steps;
    const t = t0 + (t1 - t0) * localT;

    if (distSq + PROJECT_TIE_EPSILON_SQ < minDistSq) {
      minDistSq = distSq;
      bestT = t;
      bestHintDelta = hintT === undefined ? 0 : Math.abs(t - hintT);
      continue;
    }
    if (hintT === undefined) continue;
    if (distSq > minDistSq + PROJECT_TIE_EPSILON_SQ) continue;
    const hintDelta = Math.abs(t - hintT);
    if (
      hintDelta < bestHintDelta ||
      (hintDelta === bestHintDelta && t > bestT)
    ) {
      bestT = t;
      bestHintDelta = hintDelta;
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
  if (isCurvedSegment(segment)) {
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
  hintT?: number,
): number {
  if (isCurvedSegment(segment)) {
    return projectPointOntoCurve(point, segment, CURVE_SAMPLE_STEPS, hintT);
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

// Progressive projection: each sample is projected with the previous progress as a hint.
// Required for self-overlapping polylines where a standalone nearest-point projection
// cannot tell which branch of the curve a point belongs to.
export function projectPathProgressively(
  points: readonly Point[],
  segment: LineSegment,
): number[] {
  const ts: number[] = [];
  if (points.length === 0) return ts;
  ts.push(projectPointOntoSegment(points[0], segment));
  for (let i = 1; i < points.length; i++) {
    ts.push(projectPointOntoSegment(points[i], segment, ts[i - 1]));
  }
  return ts;
}

export function computeCoverage(
  points: readonly Point[],
  segment: LineSegment,
): number {
  if (points.length === 0 || isDegenerate(segment)) return 0;

  if (isCurvedSegment(segment)) {
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
      const t = projectPointOntoSegment(point, segment, prevT);
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
  if (isCurvedSegment(segment)) return null;
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
  if (!isCurvedSegment(segment)) return segmentDirection(segment);
  if (isPolylineCurve(segment)) {
    const path = getPolylinePathData(segment);
    if (path.segments.length === 0 || path.totalLength === 0) return null;

    const clampedT = t < 0 ? 0 : t > 1 ? 1 : t;
    const targetLength = path.totalLength * clampedT;
    let walked = 0;
    for (let i = 0; i < path.lengths.length; i++) {
      const segLength = path.lengths[i];
      const subSegment = path.segments[i];
      const nextWalked = walked + segLength;
      if (targetLength <= nextWalked || i === path.lengths.length - 1) {
        const localT =
          segLength === 0 ? 0 : (targetLength - walked) / segLength;
        if (isCurvedSegment(subSegment)) {
          return segmentTangentAt(subSegment, localT);
        }
        const dx = subSegment.end.x - subSegment.start.x;
        const dy = subSegment.end.y - subSegment.start.y;
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
  return stadiumTangentAt(segment, t);
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
