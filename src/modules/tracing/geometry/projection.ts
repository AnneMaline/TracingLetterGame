import type { LineSegment, Point } from "../../../types";
import { isDegenerate } from "./boundary";
import {
  CURVE_SAMPLE_STEPS,
  curveLength,
  isCurvedSegment,
  sampleCurve,
} from "./curves";
import { isClosedLoopSegment, unwrapLoopT, wrapLoopT } from "./oval";
import { clamp01, distanceBetween } from "./vector";

// Coverage gating: a single step can earn at most this multiple of the progress implied by
// the pointer's physical travel (plus a tiny epsilon), so projection jumps cannot fake progress.
const PROGRESS_GAIN_FACTOR = 1.6;
const PROGRESS_EPSILON_T = 0.004;

// On self-overlapping polylines multiple branches project to (almost) the same distance;
// within this squared-distance tie window prefer the candidate whose t is closest to `hintT`,
// then the larger (forward) t.
const PROJECT_TIE_EPSILON_SQ = 1e-8;

function projectPointOntoCurve(
  point: Point,
  segment: LineSegment,
  hintT?: number,
): number {
  const samples = sampleCurve(segment);
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
        : clamp01(((point.x - a.x) * dx + (point.y - a.y) * dy) / lenSq);
    const ddx = point.x - (a.x + dx * localT);
    const ddy = point.y - (a.y + dy * localT);
    const distSq = ddx * ddx + ddy * ddy;
    const t0 = i / CURVE_SAMPLE_STEPS;
    const t = t0 + ((i + 1) / CURVE_SAMPLE_STEPS - t0) * localT;

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

// Nearest-point progress t in [0, 1] along the segment.
export function projectPointOntoSegment(
  point: Point,
  segment: LineSegment,
  hintT?: number,
): number {
  if (isCurvedSegment(segment)) {
    return projectPointOntoCurve(point, segment, hintT);
  }
  const dx = segment.end.x - segment.start.x;
  const dy = segment.end.y - segment.start.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return 0;
  return clamp01(
    ((point.x - segment.start.x) * dx + (point.y - segment.start.y) * dy) /
      lenSq,
  );
}

// Each sample is projected with the previous progress as a hint, which keeps
// self-overlapping polylines on the correct branch. Closed loops are unwrapped across the
// seam, so the result may go slightly < 0 (start behind the seam) or >= 1 (lap finished).
export function projectPathProgressively(
  points: readonly Point[],
  segment: LineSegment,
): number[] {
  const ts: number[] = [];
  if (points.length === 0) return ts;
  if (!isClosedLoopSegment(segment)) {
    ts.push(projectPointOntoSegment(points[0], segment));
    for (let i = 1; i < points.length; i++) {
      ts.push(projectPointOntoSegment(points[i], segment, ts[i - 1]));
    }
    return ts;
  }

  ts.push(unwrapLoopT(projectPointOntoSegment(points[0], segment), 0));
  for (let i = 1; i < points.length; i++) {
    const prevT = ts[i - 1];
    const rawT = projectPointOntoSegment(points[i], segment, wrapLoopT(prevT));
    ts.push(unwrapLoopT(rawT, prevT));
  }
  return ts;
}

// Canonical coverage for every segment kind: the furthest progress (frontier) reached, where
// each step may only advance the frontier by its own forward progress, capped by the pointer's
// physical travel. The segment start acts as a virtual first sample at t=0.
// Straight lines: identical to the max projected t. Curves: re-tracing or jitter never earns
// coverage twice, and seam/branch projection jumps are gated.
export function coverageFromProgress(
  points: readonly Point[],
  ts: readonly number[],
  segment: LineSegment,
): number {
  if (points.length === 0) return 0;
  if (!isCurvedSegment(segment) && isDegenerate(segment)) return 0;
  const pathLength = curveLength(segment);
  if (pathLength <= 0) return 0;

  let frontier = 0;
  let prevPoint = segment.start;
  let prevT = 0;
  for (let i = 0; i < points.length; i++) {
    const t = clamp01(ts[i]);
    const forward = t - prevT;
    if (forward > 0 && t > frontier) {
      const motionCap =
        (distanceBetween(prevPoint, points[i]) / pathLength) *
          PROGRESS_GAIN_FACTOR +
        PROGRESS_EPSILON_T;
      frontier = Math.min(t, frontier + Math.min(forward, motionCap));
      if (frontier >= 1) return 1;
    }
    prevPoint = points[i];
    prevT = t;
  }
  return frontier;
}

export function computeCoverage(
  points: readonly Point[],
  segment: LineSegment,
): number {
  return coverageFromProgress(
    points,
    projectPathProgressively(points, segment),
    segment,
  );
}
