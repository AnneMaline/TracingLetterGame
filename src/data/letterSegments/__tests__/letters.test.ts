import { describe, expect, it } from "vitest";
import { letters } from "..";
import type { LineSegment, Point } from "../../../types";
import {
  curvePointAt,
  segmentLength,
} from "../../../modules/tracing/geometry";
import { evaluatePathM2 } from "../../../modules/tracing/scoring";

const CANVAS_MIN = 0;
const CANVAS_MAX = 1;

function byId(id: string) {
  const letter = letters.find((entry) => entry.id === id);
  if (!letter) throw new Error(`Missing letter ${id}`);
  return letter;
}

function expectPoint(point: Point, expected: Point) {
  expect(point.x).toBeCloseTo(expected.x, 3);
  expect(point.y).toBeCloseTo(expected.y, 3);
}

function expectPolyline(
  segment: LineSegment,
  expected: { start: Point; points: Point[]; end: Point },
) {
  expect(segment.isCurve).toBe(true);
  expect(segment.curveKind).toBe("polyline");
  expectPoint(segment.start, expected.start);
  expect(segment.polylinePoints).toHaveLength(expected.points.length);
  for (const [index, point] of expected.points.entries()) {
    expectPoint(segment.polylinePoints![index], point);
  }
  expectPoint(segment.end, expected.end);
}

function expectBezier(
  segment: LineSegment,
  expected: { start: Point; segmentCount: number; end: Point },
) {
  expect(segment.isCurve).toBe(true);
  expect(segment.curveKind).toBe("bezier");
  expectPoint(segment.start, expected.start);
  expect(segment.bezierSegments).toHaveLength(expected.segmentCount);
  expectPoint(segment.end, expected.end);
}

function sampleSegment(segment: LineSegment, steps = 96): Point[] {
  const points: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    if (segment.isCurve) {
      points.push(curvePointAt(segment, t));
    } else {
      points.push({
        x: segment.start.x + (segment.end.x - segment.start.x) * t,
        y: segment.start.y + (segment.end.y - segment.start.y) * t,
      });
    }
  }
  return points;
}

describe("letterSegments invariants (task 003)", () => {
  it("exports 26 letters covering A-Z alphabetically", () => {
    expect(letters).toHaveLength(26);
    const expected = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    expect(letters.map((l) => l.id)).toEqual(expected);
  });

  for (const letter of letters) {
    describe(`letter ${letter.id}`, () => {
      it("has non-empty id and displayLabel", () => {
        expect(letter.id).toBeTruthy();
        expect(letter.displayLabel).toBeTruthy();
      });

      it("has at least one segment", () => {
        expect(letter.segments.length).toBeGreaterThanOrEqual(1);
      });

      it("has no degenerate (zero-length) segments", () => {
        for (const [i, seg] of letter.segments.entries()) {
          expect(
            segmentLength(seg),
            `${letter.id} segment ${i} is zero-length`,
          ).toBeGreaterThan(0);
        }
      });

      it("keeps every segment endpoint inside the normalized canvas", () => {
        for (const [i, seg] of letter.segments.entries()) {
          for (const [key, p] of [
            ["start", seg.start],
            ["end", seg.end],
          ] as const) {
            expect(
              p.x,
              `${letter.id} segment ${i} ${key}.x out of bounds`,
            ).toBeGreaterThanOrEqual(CANVAS_MIN);
            expect(
              p.x,
              `${letter.id} segment ${i} ${key}.x out of bounds`,
            ).toBeLessThanOrEqual(CANVAS_MAX);
            expect(
              p.y,
              `${letter.id} segment ${i} ${key}.y out of bounds`,
            ).toBeGreaterThanOrEqual(CANVAS_MIN);
            expect(
              p.y,
              `${letter.id} segment ${i} ${key}.y out of bounds`,
            ).toBeLessThanOrEqual(CANVAS_MAX);
          }
        }
      });
    });
  }
});

describe("letter stroke-order corrections (task 005)", () => {
  it("groups the corrected letters into the intended number of traceable strokes", () => {
    expect(byId("A").segments).toHaveLength(2);
    expect(byId("B").segments).toHaveLength(2);
    expect(byId("G").segments).toHaveLength(1);
    expect(byId("K").segments).toHaveLength(2);
    expect(byId("L").segments).toHaveLength(1);
    expect(byId("M").segments).toHaveLength(2);
    expect(byId("N").segments).toHaveLength(2);
    expect(byId("O").segments).toHaveLength(1);
    expect(byId("Q").segments).toHaveLength(2);
    expect(byId("R").segments).toHaveLength(2);
    expect(byId("T").segments).toHaveLength(2);
    expect(byId("V").segments).toHaveLength(1);
    expect(byId("W").segments).toHaveLength(1);
    expect(byId("Y").segments).toHaveLength(2);
    expect(byId("Z").segments).toHaveLength(1);
  });

  it("draws A as a bottom-left to top to bottom-right arch, then crossbar", () => {
    expectPolyline(byId("A").segments[0], {
      start: { x: 0.22, y: 0.86 },
      points: [{ x: 0.5, y: 0.12 }],
      end: { x: 0.78, y: 0.86 },
    });
    expectPoint(byId("A").segments[1].start, { x: 0.34, y: 0.58 });
  });

  it("keeps specified angular stroke groups continuous", () => {
    expectPolyline(byId("K").segments[1], {
      start: { x: 0.65, y: 0.14 },
      points: [{ x: 0.25, y: 0.5 }],
      end: { x: 0.65, y: 0.86 },
    });
    expectPolyline(byId("L").segments[0], {
      start: { x: 0.34, y: 0.14 },
      points: [{ x: 0.34, y: 0.84 }],
      end: { x: 0.76, y: 0.84 },
    });
    expectPolyline(byId("V").segments[0], {
      start: { x: 0.2, y: 0.14 },
      points: [{ x: 0.5, y: 0.86 }],
      end: { x: 0.8, y: 0.14 },
    });
    expectPolyline(byId("Z").segments[0], {
      start: { x: 0.2, y: 0.14 },
      points: [
        { x: 0.75, y: 0.14 },
        { x: 0.2, y: 0.86 },
      ],
      end: { x: 0.75, y: 0.86 },
    });
  });

  it("uses structured rounded Bezier arches for B, G, and R", () => {
    expectBezier(byId("B").segments[1], {
      start: { x: 0.25, y: 0.14 },
      segmentCount: 2,
      end: { x: 0.25, y: 0.86 },
    });
    expectBezier(byId("G").segments[0], {
      start: { x: 0.7, y: 0.26 },
      segmentCount: 3,
      end: { x: 0.55, y: 0.53 },
    });
    expectBezier(byId("R").segments[1], {
      start: { x: 0.25, y: 0.14 },
      segmentCount: 2,
      end: { x: 0.6, y: 0.86 },
    });
  });

  it("keeps M, N, W, and Y in the requested continuous groups", () => {
    expectPolyline(byId("M").segments[1], {
      start: { x: 0.2, y: 0.14 },
      points: [
        { x: 0.5, y: 0.55 },
        { x: 0.8, y: 0.14 },
      ],
      end: { x: 0.8, y: 0.86 },
    });
    expectPolyline(byId("N").segments[1], {
      start: { x: 0.25, y: 0.14 },
      points: [{ x: 0.75, y: 0.86 }],
      end: { x: 0.75, y: 0.14 },
    });
    expectPolyline(byId("W").segments[0], {
      start: { x: 0.15, y: 0.14 },
      points: [
        { x: 0.3, y: 0.86 },
        { x: 0.5, y: 0.38 },
        { x: 0.7, y: 0.86 },
      ],
      end: { x: 0.85, y: 0.14 },
    });
    expectPolyline(byId("Y").segments[0], {
      start: { x: 0.2, y: 0.14 },
      points: [{ x: 0.5, y: 0.5 }],
      end: { x: 0.8, y: 0.14 },
    });
  });

  it("draws T in the opposite order from the previous fixture", () => {
    const [stem, top] = byId("T").segments;
    expectPoint(stem.start, { x: 0.5, y: 0.18 });
    expectPoint(stem.end, { x: 0.5, y: 0.84 });
    expectPoint(top.start, { x: 0.2, y: 0.18 });
    expectPoint(top.end, { x: 0.8, y: 0.18 });
  });

  it("draws O and Q clockwise", () => {
    for (const id of ["O", "Q"]) {
      const oval = byId(id).segments[0];
      expect(oval.curveKind).toBe("oval");
      expect(oval.ovalCounterClockwise).toBe(false);
      const quarter = curvePointAt(oval, 0.25);
      expect(quarter.x).toBeGreaterThan(oval.ovalCenter!.x);
    }
  });

  it("can complete each corrected continuous stroke without deviation-reset at authored corners", () => {
    const corrected = new Set(["A", "B", "G", "K", "L", "M", "N", "O", "Q", "R", "T", "V", "W", "Y", "Z"]);
    for (const letter of letters.filter((entry) => corrected.has(entry.id))) {
      for (const [index, segment] of letter.segments.entries()) {
        const result = evaluatePathM2(sampleSegment(segment), segment, true);
        expect(result.kind, `${letter.id} segment ${index}`).toBe("complete");
      }
    }
  });
});
