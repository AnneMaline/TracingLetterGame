import type { LineSegment, Point } from "../../types";
import {
  CURVE_DEVIATION_MIN_TRAVEL,
  CURVE_DEVIATION_THRESHOLD_DEGREES,
  DEVIATION_THRESHOLD_DEGREES,
  DRAG_DIRECTION_BASELINE,
  MIN_SEGMENT_COVERAGE,
  START_REGION_RADIUS,
} from "../../shared/constants";
import {
  angleBetweenDegrees,
  computeBoundaryBox,
  computeCoverage,
  computeDragDirection,
  coverageFromProgress,
  distanceBetween,
  isClosedLoopSegment,
  isCurvedSegment,
  isPointInBox,
  projectPathProgressively,
  segmentDirection,
  segmentPointAt,
  segmentTangentAt,
  shouldSuppressDeviationAtPolylineCorner,
  wrapLoopT,
} from "./geometry";

// Progress (t) the tail may slip backward before the trace counts as backtracking.
const BACKTRACK_TOLERANCE = 0.02;

export type SegmentOutcome =
  | { kind: "in-progress"; coverage: number }
  | { kind: "exit-box"; coverage: number; exitIndex: number }
  | { kind: "deviation-reset"; coverage: number; departureIndex: number }
  | { kind: "complete"; coverage: number }
  | { kind: "reset"; coverage: number };

export interface EvaluateSegmentPathOptions {
  thresholdDegrees?: number;
  baselineDistance?: number;
  // Progress the attempt starts from: 0 for the segment start, or the resume frontier after a
  // lift. When set, samples inside the anchor's touch region are exempt from the box check.
  startT?: number;
}

// Pure scoring for one segment attempt (DEVSPEC Segment Completion + Deviation Detection):
// any sample outside the boundary box resets; the current tail backtracking or deviating past
// the angle threshold resets (on curves the deviation must persist over a short travel);
// otherwise the attempt completes on finger-up with >= 80% coverage (or mid-drag once a closed
// loop's lap is finished). Direction is checked only at the tail so historical noise cannot
// cancel an on-course trace.
export function evaluateSegmentPath(
  points: readonly Point[],
  segment: LineSegment,
  fingerUp: boolean,
  options: EvaluateSegmentPathOptions = {},
): SegmentOutcome {
  const isCurve = isCurvedSegment(segment);
  const thresholdDegrees =
    options.thresholdDegrees ??
    (isCurve ? CURVE_DEVIATION_THRESHOLD_DEGREES : DEVIATION_THRESHOLD_DEGREES);
  const baselineDistance = options.baselineDistance ?? DRAG_DIRECTION_BASELINE;
  const minDeviationTravel = isCurve ? CURVE_DEVIATION_MIN_TRAVEL : 0;
  const { startT } = options;

  const box = computeBoundaryBox(segment);
  const anchor = startT === undefined ? null : segmentPointAt(segment, startT);
  const exitIndex = points.findIndex(
    (p) =>
      !isPointInBox(p, box) &&
      !(anchor && distanceBetween(p, anchor) <= START_REGION_RADIUS),
  );
  if (exitIndex !== -1) {
    return {
      kind: "exit-box",
      coverage: computeCoverage(points.slice(0, exitIndex), segment, startT),
      exitIndex,
    };
  }

  const ts = projectPathProgressively(points, segment, startT);
  const coverage = coverageFromProgress(points, ts, segment, startT);
  const tailT = ts.length > 0 ? ts[ts.length - 1] : 0;

  if (
    points.length >= 2 &&
    isDeviating(
      points,
      ts,
      segment,
      thresholdDegrees,
      baselineDistance,
      minDeviationTravel,
    )
  ) {
    return {
      kind: "deviation-reset",
      coverage,
      departureIndex: points.length - 1,
    };
  }

  // Closed loops end where they start: crossing the seam with enough coverage finishes the
  // lap even if no pointer sample landed inside the small end marker.
  if (
    isClosedLoopSegment(segment) &&
    tailT >= 1 &&
    coverage >= MIN_SEGMENT_COVERAGE
  ) {
    return { kind: "complete", coverage };
  }
  if (!fingerUp) return { kind: "in-progress", coverage };
  return coverage >= MIN_SEGMENT_COVERAGE
    ? { kind: "complete", coverage }
    : { kind: "reset", coverage };
}

type SampleCheck = "ok" | "backtrack" | "off-angle";

// Direction check for sample i (i >= 1), using only the samples up to and including it.
function checkSample(
  points: readonly Point[],
  ts: readonly number[],
  i: number,
  segment: LineSegment,
  thresholdDegrees: number,
  baselineDistance: number,
): SampleCheck {
  const prevT = ts[i - 1];
  const tailT = ts[i];
  if (
    shouldSuppressDeviationAtPolylineCorner(
      segment,
      prevT,
      tailT,
      points[i],
      baselineDistance,
    )
  ) {
    return "ok";
  }

  if (tailT + BACKTRACK_TOLERANCE < prevT) return "backtrack";

  const ideal = isCurvedSegment(segment)
    ? segmentTangentAt(
        segment,
        isClosedLoopSegment(segment) ? wrapLoopT(tailT) : tailT,
      )
    : segmentDirection(segment);
  const drag = computeDragDirection(points.slice(0, i + 1), baselineDistance);
  return ideal !== null &&
    drag !== null &&
    angleBetweenDegrees(drag, ideal) > thresholdDegrees
    ? "off-angle"
    : "ok";
}

function isDeviating(
  points: readonly Point[],
  ts: readonly number[],
  segment: LineSegment,
  thresholdDegrees: number,
  baselineDistance: number,
  minTravel: number,
): boolean {
  const check = (i: number) =>
    checkSample(points, ts, i, segment, thresholdDegrees, baselineDistance);
  const last = points.length - 1;
  const tail = check(last);
  if (tail === "ok") return false;
  if (tail === "backtrack" || minTravel <= 0) return true;

  // Off-angle must persist: every sample walked back over `minTravel` must also be off-angle.
  let travelled = 0;
  for (let i = last; i >= 1; i--) {
    travelled += distanceBetween(points[i], points[i - 1]);
    if (travelled >= minTravel) return true;
    if (i - 1 < 1 || check(i - 1) === "ok") return false;
  }
  return false;
}
