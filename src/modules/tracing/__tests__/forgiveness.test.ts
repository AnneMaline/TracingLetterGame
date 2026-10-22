import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { letters as uppercaseLetters } from "../../../data/letterSegments/english/capitalLetters";
import { letters as lowercaseLetters } from "../../../data/letterSegments/english/lowercaseLetters";
import type { LetterDefinition, LineSegment, Point } from "../../../types";
import {
  DEFAULT_BOUNDARY_PADDING,
  END_REGION_RADIUS,
  RESUME_MIN_COVERAGE,
  START_MARKER_RADIUS,
  START_REGION_RADIUS,
} from "../../../shared/constants";
import {
  computeBoundaryBox,
  isClosedLoopSegment,
  isPointInBox,
  segmentLength,
  segmentPointAt,
  segmentTangentAt,
} from "../geometry";
import { evaluateSegmentPath } from "../scoring";
import { useSegmentTrace } from "../useSegmentTrace";

const horizontal: LineSegment = {
  start: { x: 0.2, y: 0.5 },
  end: { x: 0.8, y: 0.5 },
};
const horizontalLetter: LetterDefinition = {
  id: "H",
  displayLabel: "H",
  segments: [horizontal],
};

const byId = (id: string) =>
  [...uppercaseLetters, ...lowercaseLetters].find((l) => l.id === id)!;

// A child-like trace: a slow lateral wobble plus fast small jitter around the ideal path.
function wobblyPath(
  segment: LineSegment,
  { amplitude = 0.07, from = 0, to = 1, steps = 160 } = {},
): Point[] {
  const pts: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = from + ((to - from) * i) / steps;
    const p = segmentPointAt(segment, t);
    const tan = segmentTangentAt(segment, t) ?? { x: 1, y: 0 };
    // Wobble fades in/out so the trace starts and ends on the markers.
    const envelope = Math.sin(Math.PI * ((t - from) / (to - from)));
    const offset =
      envelope *
      (amplitude * Math.sin(4 * Math.PI * t) +
        0.005 * Math.sin(50 * Math.PI * t));
    pts.push({ x: p.x - tan.y * offset, y: p.y + tan.x * offset });
  }
  return pts;
}

function traceWithHook(letter: LetterDefinition, path: Point[]) {
  const hook = renderHook(() => useSegmentTrace(letter));
  act(() => hook.result.current.onPointerDown(path[0]));
  for (const p of path.slice(1)) {
    if (hook.result.current.view.status !== "tracing") break;
    act(() => hook.result.current.onPointerMove(p));
  }
  if (hook.result.current.view.status === "tracing") {
    act(() => hook.result.current.onPointerUp());
  }
  return hook;
}

// T-036
describe("Wider tolerance corridor (T-036)", () => {
  it("default corridor accepts a point 0.08 off a straight stroke", () => {
    const box = computeBoundaryBox(horizontal);
    expect(DEFAULT_BOUNDARY_PADDING).toBe(0.09);
    expect(isPointInBox({ x: 0.5, y: 0.58 }, box)).toBe(true);
    expect(isPointInBox({ x: 0.5, y: 0.6 }, box)).toBe(false);
  });

  it.each(["C", "G", "O", "U", "c", "g", "o", "u"])(
    "%s: the long curved stroke uses the wider curve corridor",
    (id) => {
      expect(byId(id).segments[0].boundaryHalfWidth).toBe(0.11);
    },
  );
});

// T-037
describe("Enlarged start region (T-037)", () => {
  it("starts tracing from a press outside the corridor but inside the start region", () => {
    const down = { x: 0.2, y: 0.5 + START_REGION_RADIUS - 0.005 };
    expect(isPointInBox(down, computeBoundaryBox(horizontal))).toBe(false);
    const path: Point[] = [down];
    for (let i = 1; i <= 30; i++) {
      const k = i / 30;
      path.push({ x: 0.2 + 0.6 * k, y: 0.5 + (down.y - 0.5) * (1 - k) ** 2 });
    }
    const { result } = traceWithHook(horizontalLetter, path);
    expect(result.current.view.status).toBe("segment-complete");
  });

  it("ignores a press outside the start region and counts it as a wrong start", () => {
    const { result } = renderHook(() => useSegmentTrace(horizontalLetter));
    act(() => result.current.onPointerDown(horizontal.end));
    expect(result.current.view.status).toBe("awaiting-start");
    expect(result.current.view.wrongStartCount).toBe(1);
  });

  it("start and end markers only overlap on known short strokes", () => {
    const overlapping: string[] = [];
    for (const letter of [...uppercaseLetters, ...lowercaseLetters]) {
      letter.segments.forEach((seg, i) => {
        if (seg.isTracable === false || isClosedLoopSegment(seg)) return;
        if (segmentLength(seg) <= START_MARKER_RADIUS + END_REGION_RADIUS) {
          overlapping.push(`${letter.id}[${i}]`);
        }
      });
    }
    // Known: the 0.1-long I serifs; flagged in task 013 for a possible re-author.
    expect(overlapping).toEqual(["I[1]", "I[2]"]);
  });
});

// T-038
describe("Curve deviation forgiveness (T-038)", () => {
  const C = byId("C").segments[0];

  it("brief off-angle jitter on a curve does not reset", () => {
    const pts: Point[] = [];
    for (let i = 0; i <= 20; i++) pts.push(segmentPointAt(C, i / 60));
    const last = pts[pts.length - 1];
    // A sideways flick shorter than the minimum deviation travel.
    pts.push({ x: last.x + 0.02, y: last.y + 0.01 });
    expect(evaluateSegmentPath(pts, C, false).kind).toBe("in-progress");
  });

  it("a sustained reverse direction on a curve still resets", () => {
    const pts: Point[] = [];
    for (let i = 0; i <= 20; i++) pts.push(segmentPointAt(C, i / 60));
    for (let i = 19; i >= 14; i--) pts.push(segmentPointAt(C, i / 60));
    expect(evaluateSegmentPath(pts, C, false).kind).toBe("deviation-reset");
  });

  it.each(["C", "G", "O", "U", "c", "g", "o", "u"])(
    "%s: a wobbly child trace of the long stroke completes",
    (id) => {
      const letter = byId(id);
      const seg = letter.segments[0];
      const path = wobblyPath(seg);
      const { result } = traceWithHook(letter, path);
      expect(result.current.view.status).toBe("segment-complete");

      // The same trace leaves the previous, narrower corridor.
      const narrow = { ...seg, boundaryHalfWidth: 0.06 };
      expect(evaluateSegmentPath(path, narrow, true).kind).toBe("exit-box");
    },
  );
});

// T-039
describe("Resume after lift (T-039)", () => {
  const letterC = byId("C");
  const C = letterC.segments[0];
  const firstHalf = wobblyPath(C, { to: 0.5, amplitude: 0 });

  function pauseHalfway() {
    const hook = traceWithHook(letterC, firstHalf);
    expect(hook.result.current.view.status).toBe("segment-paused");
    return hook;
  }

  it("lifting with some progress pauses and keeps the progress", () => {
    const { result } = pauseHalfway();
    expect(result.current.view.resumeT).toBeGreaterThan(0.45);
    expect(result.current.view.coverage).toBe(result.current.view.resumeT);
  });

  it("lifting with almost no progress is a plain reset", () => {
    const { result } = traceWithHook(
      letterC,
      wobblyPath(C, { to: RESUME_MIN_COVERAGE / 2, amplitude: 0 }),
    );
    expect(result.current.view.status).toBe("segment-reset");
    expect(result.current.view.resumeT).toBeNull();
  });

  it("pressing the resume dot continues the same attempt to completion", () => {
    const { result } = pauseHalfway();
    const resumeT = result.current.view.resumeT!;
    const rest = wobblyPath(C, { from: resumeT, amplitude: 0 });
    act(() => result.current.onPointerDown(rest[0]));
    expect(result.current.view.status).toBe("tracing");
    expect(result.current.view.coverage).toBe(resumeT);
    for (const p of rest.slice(1)) {
      if (result.current.view.status !== "tracing") break;
      act(() => result.current.onPointerMove(p));
    }
    expect(result.current.view.status).toBe("segment-complete");
  });

  it("pressing the start dot instead starts a fresh attempt", () => {
    const { result } = pauseHalfway();
    act(() => result.current.onPointerDown(C.start));
    expect(result.current.view.status).toBe("tracing");
    expect(result.current.view.coverage).toBe(0);
  });

  it("pressing elsewhere stays paused and counts as a wrong start", () => {
    const { result } = pauseHalfway();
    act(() => result.current.onPointerDown(C.end));
    expect(result.current.view.status).toBe("segment-paused");
    expect(result.current.view.wrongStartCount).toBe(1);
  });

  it("a deviation after resuming resets the whole segment", () => {
    const { result } = pauseHalfway();
    const resumeT = result.current.view.resumeT!;
    act(() => result.current.onPointerDown(segmentPointAt(C, resumeT)));
    for (let i = 1; i <= 8; i++) {
      act(() =>
        result.current.onPointerMove(segmentPointAt(C, resumeT - i / 60)),
      );
    }
    expect(result.current.view.status).toBe("segment-reset");
    expect(result.current.view.resumeT).toBeNull();
  });
});
