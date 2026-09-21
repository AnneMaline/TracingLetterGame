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
  isCurvedSegment,
  isPointInBox,
  projectPathProgressively,
  segmentDirection,
  segmentTangentAt,
  shouldSuppressDeviationAtPolylineCorner,
} from "./geometry";

const BACKTRACK_TOLERANCE = 0.02;

export type SegmentOutcome =
  | { kind: "in-progress"; coverage: number }
  | { kind: "exit-box"; coverage: number; exitIndex: number }
  | { kind: "complete"; coverage: number }
  | { kind: "reset"; coverage: number };

export type SegmentOutcomeM2 =
  | SegmentOutcome
  | {
      kind: "deviation-reset";
      coverage: number;
      departureIndex: number;
    };

export interface EvaluatePathM2Options {
  thresholdDegrees?: number;
  baselineDistance?: number;
}

// M2 layers angular-deviation cancellation on top of the MVP rules. Direction is checked only
// at the current tail (most recent motion) so historical noise cannot cancel an on-course trace.
export function evaluatePathM2(
  points: readonly Point[],
  segment: LineSegment,
  fingerUp: boolean,
  options: EvaluatePathM2Options = {},
): SegmentOutcomeM2 {
  const thresholdDegrees =
    options.thresholdDegrees ?? DEVIATION_THRESHOLD_DEGREES;
  const baselineDistance = options.baselineDistance ?? DRAG_DIRECTION_BASELINE;

  const box = computeBoundaryBox(segment);

  for (let i = 0; i < points.length; i++) {
    if (!isPointInBox(points[i], box)) {
      return {
        kind: "exit-box",
        coverage: computeCoverage(points.slice(0, i), segment),
        exitIndex: i,
      };
    }
  }

  if (points.length >= 2) {
    const tail = points[points.length - 1];
    // Progressive projection so prevT/tailT stay on the correct branch of self-overlapping
    // polylines (hard-mode B's two bumps share the y=0.5 arm — a single-point nearest
    // projection cannot tell which bump owns a shared-arm sample).
    const ts = projectPathProgressively(points, segment);
    const prevT = ts[ts.length - 2];
    const tailT = ts[ts.length - 1];
    const suppressDeviationCheck = shouldSuppressDeviationAtPolylineCorner(
      segment,
      prevT,
      tailT,
      tail,
      baselineDistance,
    );

    if (!suppressDeviationCheck && tailT + BACKTRACK_TOLERANCE < prevT) {
      return {
        kind: "deviation-reset",
        coverage: computeCoverage(points, segment),
        departureIndex: points.length - 1,
      };
    }

    const ideal = isCurvedSegment(segment)
      ? segmentTangentAt(segment, tailT)
      : segmentDirection(segment);
    const drag = computeDragDirection(points, baselineDistance);
    if (
      !suppressDeviationCheck &&
      ideal &&
      drag &&
      angleBetweenDegrees(drag, ideal) > thresholdDegrees
    ) {
      return {
        kind: "deviation-reset",
        coverage: computeCoverage(points, segment),
        departureIndex: points.length - 1,
      };
    }
  }

  const coverage = computeCoverage(points, segment);
  if (!fingerUp) return { kind: "in-progress", coverage };
  return coverage >= MIN_SEGMENT_COVERAGE
    ? { kind: "complete", coverage }
    : { kind: "reset", coverage };
}
