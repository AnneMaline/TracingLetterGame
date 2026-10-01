import type { LineSegment, Point } from "../../../types";
import { clamp01, type UnitVector, unitVector } from "./vector";

export type OvalCurveSegment = LineSegment & {
  curveKind: "oval";
  ovalCenter: Point;
  ovalRadiusX: number;
  ovalRadiusY: number;
  ovalStartAngleDeg: number;
  ovalEndAngleDeg: number;
};

// Sweeps at least this wide are treated as full circles (O, o, dots on i/j).
const CLOSED_LOOP_MIN_SWEEP_DEG = 350;

export function isOvalCurve(
  segment: LineSegment,
): segment is OvalCurveSegment {
  return (
    segment.curveKind === "oval" &&
    !!segment.ovalCenter &&
    typeof segment.ovalRadiusX === "number" &&
    typeof segment.ovalRadiusY === "number" &&
    typeof segment.ovalStartAngleDeg === "number" &&
    typeof segment.ovalEndAngleDeg === "number"
  );
}

// Signed sweep in degrees; counter-clockwise (the default) is positive.
function ovalSweepDeg(segment: OvalCurveSegment): number {
  let delta = segment.ovalEndAngleDeg - segment.ovalStartAngleDeg;
  if (segment.ovalCounterClockwise ?? true) {
    while (delta <= 0) delta += 360;
  } else {
    while (delta >= 0) delta -= 360;
  }
  return delta;
}

// Full-circle ovals start and end at the same spot, so progress is ambiguous at the seam.
export function isClosedLoopSegment(segment: LineSegment): boolean {
  return (
    isOvalCurve(segment) &&
    Math.abs(ovalSweepDeg(segment)) >= CLOSED_LOOP_MIN_SWEEP_DEG
  );
}

// Shifts rawT by a whole lap so it lands closest to prevT (t may go < 0 or > 1 across the seam).
export function unwrapLoopT(rawT: number, prevT: number): number {
  return rawT + Math.round(prevT - rawT);
}

export function wrapLoopT(t: number): number {
  return t - Math.floor(t);
}

function ovalAngleRad(segment: OvalCurveSegment, t: number): number {
  const angleDeg = segment.ovalStartAngleDeg + ovalSweepDeg(segment) * clamp01(t);
  return (angleDeg * Math.PI) / 180;
}

export function ovalPointAt(segment: OvalCurveSegment, t: number): Point {
  const angle = ovalAngleRad(segment, t);
  return {
    x: segment.ovalCenter.x + segment.ovalRadiusX * Math.cos(angle),
    y: segment.ovalCenter.y - segment.ovalRadiusY * Math.sin(angle),
  };
}

export function ovalTangentAt(
  segment: OvalCurveSegment,
  t: number,
): UnitVector | null {
  const angle = ovalAngleRad(segment, t);
  const sweepRad = (ovalSweepDeg(segment) * Math.PI) / 180;
  return unitVector(
    -segment.ovalRadiusX * Math.sin(angle) * sweepRad,
    -segment.ovalRadiusY * Math.cos(angle) * sweepRad,
  );
}
