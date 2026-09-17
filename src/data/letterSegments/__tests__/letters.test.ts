import { describe, expect, it } from "vitest";
import { letters } from "..";
import { segmentLength } from "../../../modules/tracing/geometry";

const CANVAS_MIN = 0;
const CANVAS_MAX = 1;

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
