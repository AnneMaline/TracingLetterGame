import type { LineSegment, Point } from "../../types";
import { MIN_SEGMENT_COVERAGE } from "../../shared/constants";
import { computeBoundaryBox, computeCoverage, isPointInBox } from "./geometry";

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
