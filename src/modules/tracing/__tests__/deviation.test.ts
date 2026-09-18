import { describe, expect, it } from "vitest";
import type { LineSegment, Point } from "../../../types";
import { evaluatePathM2 } from "../scoring";
import {
  angleBetweenDegrees,
  computeDragDirection,
  curvePointAt,
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

const curveThenLineSharpCorner: LineSegment = {
  start: { x: 0.25, y: 0.14 },
  end: { x: 0.6, y: 0.86 },
  curveKind: "polyline",
  polylinePoints: [
    {
      start: { x: 0.25, y: 0.14 },
      end: { x: 0.25, y: 0.5 },
      isCurve: true,
      curveControlX: 0.65,
    },
    { start: { x: 0.25, y: 0.5 }, end: { x: 0.6, y: 0.86 } },
  ],
};

const rightAnglePolyline: LineSegment = {
  start: { x: 0.2, y: 0.2 },
  end: { x: 0.8, y: 0.8 },
  curveKind: "polyline",
  polylinePoints: [{ x: 0.2, y: 0.8 }],
};

const harderWPolyline: LineSegment = {
  start: { x: 0.15, y: 0.14 },
  end: { x: 0.85, y: 0.14 },
  isCurve: true,
  curveKind: "polyline",
  polylinePoints: [
    { x: 0.3, y: 0.86 },
    { x: 0.5, y: 0.38 },
    { x: 0.7, y: 0.86 },
  ],
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
  it("emits deviation-reset on a large off-tangent motion", () => {
    const pts: Point[] = [
      { x: 0.25, y: 0.14 },
      { x: 0.35, y: 0.14 },
      { x: 0.45, y: 0.14 },
      { x: 0.45, y: 0.19 },
    ];
    const out = evaluatePathM2(pts, curveTopB, false);
    expect(out.kind).toBe("deviation-reset");
  });

  it("emits deviation-reset when backward movement departs curve direction", () => {
    const pts: Point[] = [
      { x: 0.25, y: 0.14 },
      { x: 0.35, y: 0.14 },
      { x: 0.45, y: 0.14 },
      { x: 0.55, y: 0.14 },
      { x: 0.45, y: 0.14 },
    ];
    const out = evaluatePathM2(pts, curveTopB, false);
    expect(out.kind).toBe("deviation-reset");
  });

  it("does not deviation-reset at an intentional sharp corner in a polyline curve", () => {
    const pts: Point[] = [];
    for (let i = 0; i <= 36; i++) {
      pts.push(curvePointAt(curveThenLineSharpCorner, i / 60));
    }
    const out = evaluatePathM2(pts, curveThenLineSharpCorner, false);
    expect(out.kind).toBe("in-progress");
  });

  it("keeps tracing active for a small movement immediately after that sharp corner", () => {
    const pts: Point[] = [];
    for (let i = 0; i <= 42; i++) {
      pts.push(curvePointAt(curveThenLineSharpCorner, i / 60));
    }
    const last = pts[pts.length - 1];
    pts.push({ x: last.x + 0.08, y: last.y - 0.02 });
    const out = evaluatePathM2(pts, curveThenLineSharpCorner, false);
    expect(out.kind).toBe("in-progress");
  });

  it("does not deviation-reset while turning inside the corner boundary before corner progress is crossed", () => {
    const pts: Point[] = [
      { x: 0.2, y: 0.2 },
      { x: 0.2, y: 0.5 },
      { x: 0.2, y: 0.74 },
      { x: 0.24, y: 0.76 },
    ];
    const out = evaluatePathM2(pts, rightAnglePolyline, false);
    expect(out.kind).toBe("in-progress");
  });

  it("does not deviation-reset near the first W corner when tracing slightly left of the segment", () => {
    const pts: Point[] = [];
    for (let i = 0; i <= 15; i++) {
      pts.push(curvePointAt(harderWPolyline, (i / 20) * 0.33));
    }
    pts.push({ x: 0.245, y: 0.79 });
    pts.push({ x: 0.27, y: 0.84 });

    const out = evaluatePathM2(pts, harderWPolyline, false);
    expect(out.kind).toBe("in-progress");
  });
});

// Hard-mode B has two stacked stadium bumps sharing the horizontal arm at y=0.5.
// Standalone nearest-point projection cannot tell which bump a shared-arm sample belongs
// to; the tracing engine must use progressive projection to keep the trace on the
// forward branch when moving from the end of bump 1 into bump 2.
const hardBTwoBumps: LineSegment = {
  start: { x: 0.25, y: 0.14 },
  end: { x: 0.25, y: 0.86 },
  curveKind: "polyline",
  polylinePoints: [
    {
      start: { x: 0.25, y: 0.14 },
      end: { x: 0.25, y: 0.5 },
      isCurve: true,
      curveControlX: 0.65,
    },
    {
      start: { x: 0.25, y: 0.5 },
      end: { x: 0.25, y: 0.86 },
      isCurve: true,
      curveControlX: 0.65,
    },
  ],
};

describe("Self-overlapping polyline curves (hard-mode B) — T-024", () => {
  it("does not cancel when tracing continues from the end of bump 1 into the start of bump 2 along the shared arm", () => {
    const pts: Point[] = [];
    // Trace all of bump 1 (t = 0 .. 0.5), then continue rightward along the shared
    // y=0.5 arm and into bump 2 (t = 0.5 .. 0.7).
    for (let i = 0; i <= 60; i++) {
      pts.push(curvePointAt(hardBTwoBumps, (i / 60) * 0.7));
    }
    const out = evaluatePathM2(pts, hardBTwoBumps, false);
    expect(out.kind).toBe("in-progress");
  });

  it("completes a full trace of both bumps", () => {
    const pts: Point[] = [];
    for (let i = 0; i <= 80; i++) {
      pts.push(curvePointAt(hardBTwoBumps, i / 80));
    }
    const out = evaluatePathM2(pts, hardBTwoBumps, true);
    expect(out.kind).toBe("complete");
  });

  it("cancels when the trace tries to skip the arc of bump 2 by going straight down through its interior", () => {
    // Trace bump 1 fully, then dive from the shared arm straight down toward bump 2's
    // bottom (x=0.25, y=0.86) without going around the outward arc. The straight-down
    // path leaves the boundary box since the curve bulges out to x=0.65.
    const pts: Point[] = [];
    for (let i = 0; i <= 40; i++) {
      pts.push(curvePointAt(hardBTwoBumps, (i / 40) * 0.5));
    }
    pts.push({ x: 0.25, y: 0.6 });
    pts.push({ x: 0.25, y: 0.7 });
    pts.push({ x: 0.25, y: 0.8 });
    const out = evaluatePathM2(pts, hardBTwoBumps, false);
    expect(out.kind === "exit-box" || out.kind === "deviation-reset").toBe(
      true,
    );
  });

  it("tolerates cutting the corner near the (0.25,0.5) turn (imperfect child-like turn)", () => {
    // Come down bump 1 to about t=0.47, then "cut the corner": veer directly to a point
    // along the shared arm without landing on (0.25, 0.5) exactly. Simulates a child who
    // turns early.
    const pts: Point[] = [];
    for (let i = 0; i <= 40; i++) {
      pts.push(curvePointAt(hardBTwoBumps, (i / 40) * 0.47));
    }
    pts.push({ x: 0.28, y: 0.5 });
    pts.push({ x: 0.32, y: 0.5 });
    pts.push({ x: 0.36, y: 0.5 });
    const out = evaluatePathM2(pts, hardBTwoBumps, false);
    expect(out.kind).toBe("in-progress");
  });

  it("tolerates small y-jitter while tracing rightward along the shared arm (overlap zone)", () => {
    // Trace bump 1, then wiggle up-and-down slightly while moving right along y=0.5.
    // The tail stays inside the boundary box; direction checks should be relaxed because
    // the tail is spatially near the previously-traced bump-1 bottom arm.
    const pts: Point[] = [];
    for (let i = 0; i <= 40; i++) {
      pts.push(curvePointAt(hardBTwoBumps, (i / 40) * 0.5));
    }
    pts.push({ x: 0.3, y: 0.5 });
    pts.push({ x: 0.33, y: 0.52 });
    pts.push({ x: 0.36, y: 0.49 });
    pts.push({ x: 0.4, y: 0.5 });
    pts.push({ x: 0.45, y: 0.5 });
    const out = evaluatePathM2(pts, hardBTwoBumps, false);
    expect(out.kind).toBe("in-progress");
  });
});

// Regression: W's tracing already tolerates cutting corners; confirm the corner-turn
// leniency continues to work after widening the corner window.
describe("W polyline corner cutting (regression)", () => {
  const wPolyline: LineSegment = {
    start: { x: 0.15, y: 0.14 },
    end: { x: 0.85, y: 0.14 },
    isCurve: true,
    curveKind: "polyline",
    polylinePoints: [
      { x: 0.3, y: 0.86 },
      { x: 0.5, y: 0.38 },
      { x: 0.7, y: 0.86 },
    ],
  };

  it("does not cancel when the trace clips the (0.3, 0.86) corner instead of landing on it", () => {
    const pts: Point[] = [];
    for (let i = 0; i <= 20; i++) {
      pts.push(curvePointAt(wPolyline, (i / 20) * 0.2));
    }
    // Corner-cut: never actually reach (0.3, 0.86); turn early toward the next vertex.
    pts.push({ x: 0.28, y: 0.82 });
    pts.push({ x: 0.34, y: 0.76 });
    pts.push({ x: 0.4, y: 0.62 });
    const out = evaluatePathM2(pts, wPolyline, false);
    expect(out.kind).toBe("in-progress");
  });
});
