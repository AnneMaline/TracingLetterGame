import { describe, expect, it } from "vitest";
import type { LineSegment, Point } from "../../../types";
import { evaluatePathM2 } from "../scoring";

const horizontal: LineSegment = {
  start: { x: 0.2, y: 0.5 },
  end: { x: 0.8, y: 0.5 },
};

function pathAlong(segment: LineSegment, targetT: number, steps = 20): Point[] {
  const pts: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * targetT;
    pts.push({
      x: segment.start.x + (segment.end.x - segment.start.x) * t,
      y: segment.start.y + (segment.end.y - segment.start.y) * t,
    });
  }
  return pts;
}

// T-003
describe("segment complete on finger-up when coverage >= 80% (T-003)", () => {
  it("marks complete at exactly 80%", () => {
    const out = evaluatePathM2(pathAlong(horizontal, 0.8), horizontal, true);
    expect(out.kind).toBe("complete");
    if (out.kind === "complete")
      expect(out.coverage).toBeGreaterThanOrEqual(0.8);
  });
  it("marks complete at 100%", () => {
    const out = evaluatePathM2(pathAlong(horizontal, 1), horizontal, true);
    expect(out.kind).toBe("complete");
  });
});

// T-004
describe("segment resets on finger-up when coverage < 80% (T-004)", () => {
  it("resets at 50%", () => {
    const out = evaluatePathM2(pathAlong(horizontal, 0.5), horizontal, true);
    expect(out.kind).toBe("reset");
  });
  it("resets just below 80%", () => {
    const out = evaluatePathM2(pathAlong(horizontal, 0.79), horizontal, true);
    expect(out.kind).toBe("reset");
  });
});

// T-005
describe("segment resets immediately on boundary-box exit (T-005)", () => {
  it("returns exit-box before finger-up, at the point of departure", () => {
    const inBox = pathAlong(horizontal, 0.6);
    const outsidePoint: Point = { x: 0.5, y: 0.9 };
    const pts = [...inBox, outsidePoint];
    const out = evaluatePathM2(pts, horizontal, false);
    expect(out.kind).toBe("exit-box");
    if (out.kind === "exit-box") {
      expect(out.exitIndex).toBe(inBox.length);
    }
  });

  it("returns exit-box even on finger-up (does not defer to 80% check)", () => {
    const inBox = pathAlong(horizontal, 0.9);
    const outsidePoint: Point = { x: 0.5, y: 0.9 };
    const pts = [...inBox, outsidePoint];
    const out = evaluatePathM2(pts, horizontal, true);
    expect(out.kind).toBe("exit-box");
  });
});
