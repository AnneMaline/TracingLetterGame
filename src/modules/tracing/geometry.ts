import type { LineSegment, Point } from "../../types";
import { DEFAULT_BOUNDARY_PADDING } from "../../shared/constants";

export interface BoundaryBox {
  cx: number;
  cy: number;
  halfLength: number;
  halfWidth: number;
  ux: number;
  uy: number;
  isDegenerate: boolean;
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
  const relX = point.x - box.cx;
  const relY = point.y - box.cy;
  const along = relX * box.ux + relY * box.uy;
  const across = relX * -box.uy + relY * box.ux;
  return Math.abs(along) <= box.halfLength && Math.abs(across) <= box.halfWidth;
}

export function projectPointOntoSegment(
  point: Point,
  segment: LineSegment,
): number {
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

export function computeCoverage(
  points: readonly Point[],
  segment: LineSegment,
): number {
  if (points.length === 0 || isDegenerate(segment)) return 0;
  let maxT = 0;
  for (const p of points) {
    const t = projectPointOntoSegment(p, segment);
    if (t > maxT) maxT = t;
  }
  return maxT;
}
