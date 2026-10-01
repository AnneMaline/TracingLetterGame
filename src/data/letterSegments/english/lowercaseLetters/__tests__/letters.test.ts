import { describe, expect, it } from "vitest";
import { letters } from "..";
import { segmentLength } from "../../../../../modules/tracing/geometry";
import { LOWERCASE_CANVAS_HEIGHT } from "../../../../../shared/constants";
import type { LineSegment } from "../../../../../types";

const CANVAS_MIN = 0;
const CANVAS_MAX_X = 1;
const CANVAS_MAX_Y = LOWERCASE_CANVAS_HEIGHT;

function isFullCircle(seg: LineSegment): boolean {
  return (
    seg.curveKind === "oval" &&
    typeof seg.ovalStartAngleDeg === "number" &&
    typeof seg.ovalEndAngleDeg === "number" &&
    seg.ovalEndAngleDeg !== seg.ovalStartAngleDeg &&
    (seg.ovalEndAngleDeg - seg.ovalStartAngleDeg) % 360 === 0
  );
}

describe("lowercase letterSegments invariants", () => {
  it("exports 26 letters covering a-z alphabetically", () => {
    expect(letters).toHaveLength(26);
    const expected = "abcdefghijklmnopqrstuvwxyz".split("");
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
          if (isFullCircle(seg)) continue;
          expect(
            segmentLength(seg),
            `${letter.id} segment ${i} is zero-length`,
          ).toBeGreaterThan(0);
        }
      });

      it("closes full circles with identical start/end and a non-zero radius", () => {
        for (const [i, seg] of letter.segments.entries()) {
          if (!isFullCircle(seg)) continue;
          expect(
            seg.end,
            `${letter.id} segment ${i} circle not closed`,
          ).toEqual(seg.start);
          expect(seg.ovalRadiusX ?? 0).toBeGreaterThan(0);
          expect(seg.ovalRadiusY ?? 0).toBeGreaterThan(0);
        }
      });

      it("keeps every segment endpoint inside the lowercase canvas", () => {
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
            ).toBeLessThanOrEqual(CANVAS_MAX_X);
            expect(
              p.y,
              `${letter.id} segment ${i} ${key}.y out of bounds`,
            ).toBeGreaterThanOrEqual(CANVAS_MIN);
            expect(
              p.y,
              `${letter.id} segment ${i} ${key}.y out of bounds`,
            ).toBeLessThanOrEqual(CANVAS_MAX_Y);
          }
        }
      });
    });
  }
});
