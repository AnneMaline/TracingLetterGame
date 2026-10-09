import type { LineSegment, Point } from "../../types";
import {
  DEVIATION_THRESHOLD_DEGREES,
  DRAG_DIRECTION_BASELINE,
  MIN_SEGMENT_COVERAGE,
} from "../../shared/constants";
import {
  angleBetweenDegrees,
  computeBoundaryBox,
  computeCoverage,
  computeDragDirection,
  coverageFromProgress,
  isClosedLoopSegment,
  isCurvedSegment,
  isPointInBox,
  projectPathProgressively,
  segmentDirection,
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
}

// Pure scoring for one segment attempt (DEVSPEC Segment Completion + Deviation Detection):
// any sample outside the boundary box resets; the current tail backtracking or deviating past
// the angle threshold resets; otherwise the attempt completes on finger-up with >= 80% coverage
// (or mid-drag once a closed loop's lap is finished). Direction is checked only at the tail so
// historical noise cannot cancel an on-course trace.
export function evaluateSegmentPath(
  points: readonly Point[],
  segment: LineSegment,
  fingerUp: boolean,
  options: EvaluateSegmentPathOptions = {},
): SegmentOutcome {
  const thresholdDegrees =
    options.thresholdDegrees ?? DEVIATION_THRESHOLD_DEGREES;
  const baselineDistance = options.baselineDistance ?? DRAG_DIRECTION_BASELINE;

  const box = computeBoundaryBox(segment);
  const exitIndex = points.findIndex((p) => !isPointInBox(p, box));
  if (exitIndex !== -1) {
    return {
      kind: "exit-box",
      coverage: computeCoverage(points.slice(0, exitIndex), segment),
      exitIndex,
    };
  }

  const ts = projectPathProgressively(points, segment);
  const coverage = coverageFromProgress(points, ts, segment);
  const tailT = ts.length > 0 ? ts[ts.length - 1] : 0;

  if (
    points.length >= 2 &&
    isDeviating(points, ts, segment, thresholdDegrees, baselineDistance)
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

function isDeviating(
  points: readonly Point[],
  ts: readonly number[],
  segment: LineSegment,
  thresholdDegrees: number,
  baselineDistance: number,
): boolean {
  const prevT = ts[ts.length - 2];
  const tailT = ts[ts.length - 1];
  const tail = points[points.length - 1];
  if (
    shouldSuppressDeviationAtPolylineCorner(
      segment,
      prevT,
      tailT,
      tail,
      baselineDistance,
    )
  ) {
    return false;
  }

  if (tailT + BACKTRACK_TOLERANCE < prevT) return true;

  const ideal = isCurvedSegment(segment)
    ? segmentTangentAt(
        segment,
        isClosedLoopSegment(segment) ? wrapLoopT(tailT) : tailT,
      )
    : segmentDirection(segment);
  const drag = computeDragDirection(points, baselineDistance);
  return (
    ideal !== null &&
    drag !== null &&
    angleBetweenDegrees(drag, ideal) > thresholdDegrees
  );
}
