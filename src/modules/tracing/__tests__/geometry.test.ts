import { describe, expect, it } from "vitest";
import type { LineSegment, Point } from "../../../types";
import {
  computeBoundaryBox,
  computeCoverage,
  isPointInBox,
  projectPointOntoSegment,
} from "../geometry";
import { DEFAULT_BOUNDARY_PADDING } from "../../../shared/constants";

const horizontal: LineSegment = {
  start: { x: 0.2, y: 0.5 },
  end: { x: 0.8, y: 0.5 },
};
const diagonal: LineSegment = {
  start: { x: 0.1, y: 0.1 },
  end: { x: 0.9, y: 0.9 },
};

describe("projectPointOntoSegment", () => {
  it("returns 0 at start", () => {
    expect(projectPointOntoSegment(horizontal.start, horizontal)).toBe(0);
  });
  it("returns 1 at end", () => {
    expect(projectPointOntoSegment(horizontal.end, horizontal)).toBe(1);
  });
  it("returns 0.5 at midpoint", () => {
    expect(projectPointOntoSegment({ x: 0.5, y: 0.5 }, horizontal)).toBeCloseTo(
      0.5,
      5,
    );
  });
  it("clamps points beyond ends to [0,1]", () => {
    expect(projectPointOntoSegment({ x: -1, y: 0.5 }, horizontal)).toBe(0);
    expect(projectPointOntoSegment({ x: 2, y: 0.5 }, horizontal)).toBe(1);
  });
});

// T-001: coverage math correct
describe("computeCoverage (T-001)", () => {
  it("returns 0 for empty path", () => {
    expect(computeCoverage([], horizontal)).toBe(0);
  });

  const cases: Array<{ label: string; target: number }> = [
    { label: "0%", target: 0 },
    { label: "50%", target: 0.5 },
    { label: "80%", target: 0.8 },
    { label: "100%", target: 1 },
  ];

  for (const { label, target } of cases) {
    it(`computes ${label} coverage from a synthetic path along the vector`, () => {
      const N = 20;
      const pts: Point[] = [];
      for (let i = 0; i <= N; i++) {
        const t = (i / N) * target;
        pts.push({
          x: horizontal.start.x + (horizontal.end.x - horizontal.start.x) * t,
          y: horizontal.start.y + (horizontal.end.y - horizontal.start.y) * t,
        });
      }
      expect(computeCoverage(pts, horizontal)).toBeCloseTo(target, 5);
    });
  }

  it("takes the max projected t (irregular paths that backtrack)", () => {
    const pts: Point[] = [
      { x: 0.2, y: 0.5 },
      { x: 0.5, y: 0.5 },
      { x: 0.7, y: 0.5 },
      { x: 0.4, y: 0.5 },
    ];
    expect(computeCoverage(pts, horizontal)).toBeCloseTo((0.7 - 0.2) / 0.6, 5);
  });
});

// T-002: boundary-box containment
describe("boundary box containment (T-002)", () => {
  it("box extends by padding on all sides and past both ends (horizontal segment)", () => {
    const box = computeBoundaryBox(horizontal);
    expect(box.isDegenerate).toBe(false);
    expect(box.halfLength).toBeCloseTo(
      (0.8 - 0.2) / 2 + DEFAULT_BOUNDARY_PADDING,
      6,
    );
    expect(box.halfWidth).toBeCloseTo(DEFAULT_BOUNDARY_PADDING, 6);
  });

  it("classifies interior points as inside", () => {
    const box = computeBoundaryBox(horizontal);
    for (const p of [
      { x: 0.2, y: 0.5 },
      { x: 0.5, y: 0.5 },
      { x: 0.8, y: 0.5 },
      { x: 0.5, y: 0.5 + DEFAULT_BOUNDARY_PADDING * 0.9 },
      { x: 0.5, y: 0.5 - DEFAULT_BOUNDARY_PADDING * 0.9 },
    ]) {
      expect(isPointInBox(p, box)).toBe(true);
    }
  });

  it("classifies out-of-box points as outside", () => {
    const box = computeBoundaryBox(horizontal);
    for (const p of [
      { x: 0.5, y: 0.5 + DEFAULT_BOUNDARY_PADDING * 1.5 },
      { x: 0.5, y: 0.5 - DEFAULT_BOUNDARY_PADDING * 1.5 },
      { x: 0.2 - DEFAULT_BOUNDARY_PADDING * 1.5, y: 0.5 },
      { x: 0.8 + DEFAULT_BOUNDARY_PADDING * 1.5, y: 0.5 },
    ]) {
      expect(isPointInBox(p, box)).toBe(false);
    }
  });

  it("works for a diagonal segment (perpendicular check is oriented)", () => {
    const box = computeBoundaryBox(diagonal);
    expect(isPointInBox({ x: 0.5, y: 0.5 }, box)).toBe(true);
    expect(isPointInBox({ x: 0.5, y: 0.5 + 0.15 }, box)).toBe(false);
    expect(isPointInBox({ x: 0.5, y: 0.5 - 0.15 }, box)).toBe(false);
  });

  it("respects per-segment boundaryHalfWidth override", () => {
    const seg: LineSegment = { ...horizontal, boundaryHalfWidth: 0.15 };
    const box = computeBoundaryBox(seg);
    expect(box.halfWidth).toBeCloseTo(0.15, 6);
    expect(isPointInBox({ x: 0.5, y: 0.5 + 0.1 }, box)).toBe(true);
  });
});
