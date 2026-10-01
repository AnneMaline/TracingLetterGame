import type { LineSegment, Point } from "../../../types";
import { DEFAULT_BOUNDARY_PADDING } from "../../../shared/constants";
import { isCurvedSegment, sampleCurve } from "./curves";
import { distanceToPolyline } from "./vector";

// Straight segments use an oriented rectangle (padding on all sides and past both ends);
// curves use a tube of radius `halfWidth` around the sampled curve.
export interface BoundaryBox {
  cx: number;
  cy: number;
  halfLength: number;
  halfWidth: number;
  ux: number;
  uy: number;
  isDegenerate: boolean;
  curveSamples?: readonly Point[];
}

export function getSegmentPadding(segment: LineSegment): number {
  return segment.boundaryHalfWidth ?? DEFAULT_BOUNDARY_PADDING;
}

// Straight-line start->end chord length (not the curve's arc length).
export function segmentLength(segment: LineSegment): number {
  return Math.hypot(
    segment.end.x - segment.start.x,
    segment.end.y - segment.start.y,
  );
}

export function isDegenerate(segment: LineSegment): boolean {
  return segmentLength(segment) === 0;
}

export function computeBoundaryBox(
  segment: LineSegment,
  padding: number = getSegmentPadding(segment),
): BoundaryBox {
  if (isCurvedSegment(segment)) {
    const curveSamples = sampleCurve(segment);
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    for (const p of curveSamples) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    return {
      cx: (minX + maxX) / 2,
      cy: (minY + maxY) / 2,
      halfLength: (maxX - minX) / 2 + padding,
      halfWidth: padding,
      ux: 1,
      uy: 0,
      isDegenerate: false,
      curveSamples,
    };
  }

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
  if (box.curveSamples) {
    return distanceToPolyline(point, box.curveSamples) <= box.halfWidth;
  }
  const relX = point.x - box.cx;
  const relY = point.y - box.cy;
  const along = relX * box.ux + relY * box.uy;
  const across = relX * -box.uy + relY * box.ux;
  return Math.abs(along) <= box.halfLength && Math.abs(across) <= box.halfWidth;
}
