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
  isPointInBox,
  segmentDirection,
} from "./geometry";

export type SegmentOutcome =
  | { kind: "in-progress"; coverage: number }
  | { kind: "exit-box"; coverage: number; exitIndex: number }
  | { kind: "complete"; coverage: number }
  | { kind: "reset"; coverage: number };

export function evaluatePath(
  points: readonly Point[],
  segment: LineSegment,
  fingerUp: boolean,
): SegmentOutcome {
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
  const coverage = computeCoverage(points, segment);
  if (!fingerUp) return { kind: "in-progress", coverage };
  return coverage >= MIN_SEGMENT_COVERAGE
    ? { kind: "complete", coverage }
    : { kind: "reset", coverage };
}

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
  const ideal = segmentDirection(segment);

  for (let i = 0; i < points.length; i++) {
    if (!isPointInBox(points[i], box)) {
      return {
        kind: "exit-box",
        coverage: computeCoverage(points.slice(0, i), segment),
        exitIndex: i,
      };
    }
  }

  if (ideal && points.length >= 2) {
    const drag = computeDragDirection(points, baselineDistance);
    if (drag && angleBetweenDegrees(drag, ideal) > thresholdDegrees) {
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
