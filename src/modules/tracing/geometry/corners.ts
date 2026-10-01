import type { LineSegment, Point } from "../../../types";
import { getSegmentPadding } from "./boundary";
import {
  getPolylinePath,
  isCurvedSegment,
  isPolylineCurve,
  type PolylinePath,
  sampleCurve,
  subSegmentIndexAtT,
} from "./curves";
import {
  closestPointOnLineSegment,
  distanceBetween,
  distanceToPolyline,
} from "./vector";

// Multiplier applied to the segment padding to produce the corner turning window.
// Slightly larger than a single padding radius so children can "cut" or overshoot the
// exact turn point by a small amount without triggering deviation resets.
const POLYLINE_CORNER_RADIUS_FACTOR = 1.5;

interface Corner {
  t: number;
  point: Point;
}

function polylineCorners(path: PolylinePath): Corner[] {
  const corners: Corner[] = [];
  let walked = 0;
  for (let i = 0; i < path.lengths.length - 1; i++) {
    walked += path.lengths[i];
    corners.push({ t: walked / path.totalLength, point: path.segments[i].end });
  }
  return corners;
}

function distanceToSubSegment(point: Point, subSegment: LineSegment): number {
  if (isCurvedSegment(subSegment)) {
    return distanceToPolyline(point, sampleCurve(subSegment));
  }
  return distanceBetween(
    point,
    closestPointOnLineSegment(point, subSegment.start, subSegment.end),
  );
}

// Nearest distance from `tail` to any sub-segment other than the one it currently sits on.
// Small values mean another branch runs through the same area (e.g. a B-shaped polyline whose
// two bumps share the arm at y=0.5), where direction/backtrack checks are ambiguous.
function distanceToOtherBranches(
  path: PolylinePath,
  tail: Point,
  tailT: number,
): number {
  if (path.segments.length < 2) return Number.POSITIVE_INFINITY;
  const currentSubIndex = subSegmentIndexAtT(path, tailT);
  let minDist = Number.POSITIVE_INFINITY;
  for (let i = 0; i < path.segments.length; i++) {
    if (i === currentSubIndex) continue;
    const d = distanceToSubSegment(tail, path.segments[i]);
    if (d < minDist) minDist = d;
  }
  return minDist;
}

// True when the tail is turning a polyline corner or inside a self-overlap zone, where
// deviation and backtrack checks would misfire on a legitimate trace.
export function shouldSuppressDeviationAtPolylineCorner(
  segment: LineSegment,
  prevT: number,
  tailT: number,
  tailPoint: Point,
  baselineDistance: number,
): boolean {
  if (!isPolylineCurve(segment)) return false;
  const path = getPolylinePath(segment);

  const padding = getSegmentPadding(segment);
  const cornerRadius = padding * POLYLINE_CORNER_RADIUS_FACTOR;
  const cornerWindowDistance = Math.max(baselineDistance, cornerRadius);
  const cornerSpatialWindow = cornerRadius + baselineDistance;

  if (distanceToOtherBranches(path, tailPoint, tailT) <= padding) return true;
  if (path.totalLength <= 0 || path.lengths.length <= 1) return false;

  for (const corner of polylineCorners(path)) {
    const crossedCorner = prevT <= corner.t && tailT >= corner.t;
    const distancePastCorner = (tailT - corner.t) * path.totalLength;
    const stillWithinDirectionWindow =
      tailT >= corner.t && distancePastCorner <= baselineDistance;
    const pathDistanceToCorner =
      Math.min(Math.abs(tailT - corner.t), Math.abs(prevT - corner.t)) *
      path.totalLength;
    const spatialDistanceToCorner = distanceBetween(tailPoint, corner.point);
    if (
      crossedCorner ||
      stillWithinDirectionWindow ||
      pathDistanceToCorner <= cornerWindowDistance ||
      spatialDistanceToCorner <= cornerSpatialWindow
    ) {
      return true;
    }
  }

  return false;
}
