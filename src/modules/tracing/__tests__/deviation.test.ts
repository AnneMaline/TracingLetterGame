import { describe, expect, it } from "vitest";
import type { LineSegment, Point } from "../../../types";
import { evaluatePathM2 } from "../scoring";
import {
  angleBetweenDegrees,
  computeDragDirection,
  segmentDirection,
} from "../geometry";
import { DEVIATION_THRESHOLD_DEGREES } from "../../../shared/constants";

const horizontal: LineSegment = {
  start: { x: 0.2, y: 0.5 },
  end: { x: 0.8, y: 0.5 },
};
const curveTopB: LineSegment = {
  start: { x: 0.25, y: 0.14 },
  end: { x: 0.25, y: 0.5 },
  isCurve: true,
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

// T-006
describe("Deviation-angle calculation flags beyond vs. within threshold (T-006)", () => {
  it("angleBetweenDegrees returns 0 for identical unit vectors", () => {
    expect(angleBetweenDegrees({ x: 1, y: 0 }, { x: 1, y: 0 })).toBeCloseTo(
      0,
      5,
    );
  });

  it("angleBetweenDegrees returns 90 for perpendicular unit vectors", () => {
    expect(angleBetweenDegrees({ x: 1, y: 0 }, { x: 0, y: 1 })).toBeCloseTo(
      90,
      5,
    );
  });

  it("angleBetweenDegrees returns 180 for opposite unit vectors", () => {
    expect(angleBetweenDegrees({ x: 1, y: 0 }, { x: -1, y: 0 })).toBeCloseTo(
      180,
      5,
    );
  });

  it("computeDragDirection returns null for windows shorter than one usable delta", () => {
    expect(computeDragDirection([])).toBeNull();
    expect(computeDragDirection([{ x: 0.5, y: 0.5 }])).toBeNull();
  });

  it("computeDragDirection returns a unit vector aligned with the ideal for a straight trace", () => {
    const dir = computeDragDirection(pathAlong(horizontal, 0.6));
    const ideal = segmentDirection(horizontal)!;
    expect(dir).not.toBeNull();
    expect(angleBetweenDegrees(dir!, ideal)).toBeLessThan(1);
  });

  it("angle between a right-drag and a ~44-degree drag stays within the 45-degree threshold", () => {
    const drag = computeDragDirection([
      { x: 0.2, y: 0.5 },
      { x: 0.3, y: 0.5 + Math.tan((44 * Math.PI) / 180) * 0.1 },
    ])!;
    const ideal = segmentDirection(horizontal)!;
    expect(angleBetweenDegrees(drag, ideal)).toBeCloseTo(44, 2);
    expect(angleBetweenDegrees(drag, ideal)).toBeLessThan(
      DEVIATION_THRESHOLD_DEGREES,
    );
  });

  it("angle between a right-drag and a 60-degree drag exceeds the 45-degree threshold", () => {
    const drag = computeDragDirection([
      { x: 0.2, y: 0.5 },
      { x: 0.3, y: 0.5 + Math.tan((60 * Math.PI) / 180) * 0.1 },
    ])!;
    const ideal = segmentDirection(horizontal)!;
    expect(angleBetweenDegrees(drag, ideal)).toBeCloseTo(60, 2);
    expect(angleBetweenDegrees(drag, ideal)).toBeGreaterThan(
      DEVIATION_THRESHOLD_DEGREES,
    );
  });
});

// T-007
describe("Deviation past threshold cancels the trace (T-007)", () => {
  it("emits deviation-reset when the drag drifts beyond the threshold inside the box", () => {
    const inBoxAlong = pathAlong(horizontal, 0.5, 10);
    // Drift steeply downward inside the box (stays within padding 0.06 of y=0.5).
    // Each drift step is ~vertical, exceeding the 45-degree threshold vs. the horizontal ideal.
    const drift: Point[] = [
      { x: 0.505, y: 0.53 },
      { x: 0.505, y: 0.55 },
    ];
    const pts = [...inBoxAlong, ...drift];
    const out = evaluatePathM2(pts, horizontal, false);
    expect(out.kind).toBe("deviation-reset");
    if (out.kind === "deviation-reset") {
      expect(out.coverage).toBeGreaterThan(0.4);
      expect(out.coverage).toBeLessThanOrEqual(1);
      expect(out.departureIndex).toBeGreaterThanOrEqual(inBoxAlong.length);
    }
  });

  it("does not cancel when the entire trace stays aligned with the ideal vector", () => {
    const out = evaluatePathM2(pathAlong(horizontal, 0.6), horizontal, false);
    expect(out.kind).toBe("in-progress");
  });
});

// T-008
describe("Boundary-box exit after >=80% pre-finger-up coverage still resets (T-008)", () => {
  it("returns exit-box even when coverage has already reached 80%+", () => {
    const inBoxAlong = pathAlong(horizontal, 0.9, 30);
    const exitPoint: Point = { x: 0.7, y: 0.9 };
    const pts = [...inBoxAlong, exitPoint];
    const out = evaluatePathM2(pts, horizontal, false);
    expect(out.kind).toBe("exit-box");
    if (out.kind === "exit-box") {
      expect(out.exitIndex).toBe(inBoxAlong.length);
      expect(out.coverage).toBeGreaterThanOrEqual(0.8);
    }
  });

  it("returns exit-box even on finger-up when >=80% coverage was reached before the exit", () => {
    const inBoxAlong = pathAlong(horizontal, 0.9, 30);
    const exitPoint: Point = { x: 0.7, y: 0.9 };
    const pts = [...inBoxAlong, exitPoint];
    const out = evaluatePathM2(pts, horizontal, true);
    expect(out.kind).toBe("exit-box");
  });
});

// Regression: a slightly curved in-box trace whose local direction stays under the threshold
// must not cancel. Historical noise (any single sample with a bad direction reading) also
// must not cancel — only the current tail direction is checked.
describe("Natural curves under the threshold do not cancel (regression)", () => {
  it("completes a gentle arc that peaks near the box edge", () => {
    const arc: Point[] = [];
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = 0.2 + 0.6 * t;
      // Peak amplitude 0.03 (half the box padding); slope always well under 45 degrees.
      const y = 0.5 + 0.03 * Math.sin(Math.PI * t);
      arc.push({ x, y });
    }
    const out = evaluatePathM2(arc, horizontal, true);
    expect(out.kind).toBe("complete");
  });

  it("does not cancel when jitter earlier in the trace produced a locally noisy direction, if the current tail is aligned", () => {
    const jittery: Point[] = [
      { x: 0.2, y: 0.5 },
      { x: 0.22, y: 0.505 },
      { x: 0.24, y: 0.495 },
      { x: 0.26, y: 0.502 },
      { x: 0.3, y: 0.5 },
      { x: 0.4, y: 0.5 },
      { x: 0.5, y: 0.5 },
      { x: 0.6, y: 0.5 },
      { x: 0.7, y: 0.5 },
      { x: 0.8, y: 0.5 },
    ];
    const out = evaluatePathM2(jittery, horizontal, true);
    expect(out.kind).toBe("complete");
  });
});

describe("Curve segments cancel zigzags and backtracking", () => {
  it("emits deviation-reset on a large off-tangent motion inside the curve boundary", () => {
    const pts: Point[] = [
      { x: 0.25, y: 0.14 },
      { x: 0.49, y: 0.18 },
      { x: 0.61, y: 0.27 },
      { x: 0.625, y: 0.32 },
      { x: 0.68, y: 0.32 },
    ];
    const out = evaluatePathM2(pts, curveTopB, false);
    expect(out.kind).toBe("deviation-reset");
  });

  it("emits deviation-reset when the child moves backward along the curve", () => {
    const pts: Point[] = [
      { x: 0.25, y: 0.14 },
      { x: 0.49, y: 0.18 },
      { x: 0.61, y: 0.27 },
      { x: 0.61, y: 0.37 },
      { x: 0.49, y: 0.46 },
      { x: 0.61, y: 0.37 },
    ];
    const out = evaluatePathM2(pts, curveTopB, false);
    expect(out.kind).toBe("deviation-reset");
  });
});
