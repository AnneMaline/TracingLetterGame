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
  projectPointOntoSegment,
  segmentDirection,
  segmentTangentAt,
} from "./geometry";

const BACKTRACK_TOLERANCE = 0.02;
const POLYLINE_CORNER_TOLERANCE = 0.04;

function getPolylineCornerParameters(segment: LineSegment): number[] {
  if (segment.curveKind !== "polyline" || !segment.polylinePoints?.length) {
    return [];
  }

  const points = [segment.start, ...segment.polylinePoints, segment.end];
  const lengths: number[] = [];
  let totalLength = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const length = Math.hypot(
      points[i + 1].x - points[i].x,
      points[i + 1].y - points[i].y,
    );
    lengths.push(length);
    totalLength += length;
  }

  if (totalLength === 0) return [];

  let walked = 0;
  return lengths.slice(0, -1).map((length) => {
    walked += length;
    return walked / totalLength;
  });
}

function isNearPolylineCorner(segment: LineSegment, t: number): boolean {
  return getPolylineCornerParameters(segment).some(
    (cornerT) => Math.abs(t - cornerT) <= POLYLINE_CORNER_TOLERANCE,
  );
}

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
    const prev = points[points.length - 2];
    const tail = points[points.length - 1];
    const prevT = projectPointOntoSegment(prev, segment);
    const tailT = projectPointOntoSegment(tail, segment);

    const nearPolylineCorner = isNearPolylineCorner(segment, tailT);

    if (tailT + BACKTRACK_TOLERANCE < prevT && !nearPolylineCorner) {
      return {
        kind: "deviation-reset",
        coverage: computeCoverage(points, segment),
        departureIndex: points.length - 1,
      };
    }

    const ideal = segment.isCurve
      ? segmentTangentAt(segment, tailT)
      : segmentDirection(segment);
    const drag = computeDragDirection(points, baselineDistance);
    if (
      ideal &&
      drag &&
      !nearPolylineCorner &&
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
