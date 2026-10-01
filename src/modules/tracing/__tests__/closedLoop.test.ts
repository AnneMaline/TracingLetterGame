import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { letters as uppercaseLetters } from "../../../data/letterSegments/english/capitalLetters";
import { letters as lowercaseLetters } from "../../../data/letterSegments/english/lowercaseLetters";
import type { LetterDefinition, Point } from "../../../types";
import {
  curvePointAt,
  isClosedLoopSegment,
  projectPathProgressively,
} from "../geometry";
import { evaluatePathM2 } from "../scoring";
import { useSegmentTrace } from "../useSegmentTrace";

const letterO = uppercaseLetters.find((l) => l.id === "O")!;
const letterLowerO = lowercaseLetters.find((l) => l.id === "o")!;
const STEPS = 96;
const CONVERGE_STEPS = 12;

// Offsets inside the visible green start marker (r = 0.05), on both sides of the seam.
const START_OFFSETS: Point[] = [];
for (const dx of [-0.04, -0.02, 0, 0.02, 0.04]) {
  for (const dy of [-0.02, 0, 0.02]) START_OFFSETS.push({ x: dx, y: dy });
}

function traceLoop(
  letter: LetterDefinition,
  offset: Point,
  ts?: number[],
): string {
  const { result } = renderHook(() => useSegmentTrace(letter));
  const seg = letter.segments[0];
  const down: Point = { x: seg.start.x + offset.x, y: seg.start.y + offset.y };
  act(() => result.current.onPointerDown(down));
  expect(result.current.view.status).toBe("tracing");

  // Default: move forward from wherever the finger pressed, easing onto the line.
  const t0 = Math.max(0, projectPathProgressively([down], seg)[0]);
  const anchor = curvePointAt(seg, t0);
  const moves =
    ts?.map((t) => curvePointAt(seg, t)) ??
    Array.from({ length: STEPS }, (_, k) => {
      const p = curvePointAt(seg, Math.min(1, t0 + (k + 1) / STEPS));
      const w = Math.max(0, 1 - (k + 1) / CONVERGE_STEPS);
      return {
        x: p.x + (down.x - anchor.x) * w,
        y: p.y + (down.y - anchor.y) * w,
      };
    });

  for (const p of moves) {
    if (result.current.view.status !== "tracing") break;
    act(() => result.current.onPointerMove(p));
  }
  return result.current.view.status;
}

describe("Closed-loop segments (O, o)", () => {
  it("only full-circle ovals are treated as closed loops", () => {
    const closed = [...uppercaseLetters, ...lowercaseLetters]
      .filter((l) => l.segments.some(isClosedLoopSegment))
      .map((l) => l.id);
    expect(closed).toEqual(["O", "Q", "i", "j", "o"]);
  });

  for (const letter of [letterO, letterLowerO]) {
    for (const offset of START_OFFSETS) {
      it(`${letter.id}: starting anywhere on the start marker (${offset.x}, ${offset.y}) traces to completion`, () => {
        expect(traceLoop(letter, offset)).toBe("segment-complete");
      });
    }

    it(`${letter.id}: overshooting past the end marker across the seam completes instead of resetting`, () => {
      const seg = letter.segments[0];
      const pts: Point[] = [];
      for (let k = 0; k <= 93; k++) pts.push(curvePointAt(seg, k / STEPS));
      pts.push(curvePointAt(seg, 0.02));
      const out = evaluatePathM2(pts, seg, false);
      expect(out.kind).toBe("complete");
    });

    it(`${letter.id}: tracing the loop the wrong way still resets`, () => {
      const backward = Array.from(
        { length: 10 },
        (_, k) => 1 - (k + 1) / STEPS,
      );
      expect(traceLoop(letter, { x: 0, y: 0 }, backward)).toBe("segment-reset");
    });

    it(`${letter.id}: touching only the start/end markers does not complete`, () => {
      const seg = letter.segments[0];
      const out = evaluatePathM2([seg.start, seg.end, seg.start], seg, true);
      expect(out.kind).toBe("reset");
    });
  }
});
