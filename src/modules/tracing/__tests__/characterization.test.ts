import { describe, expect, it } from "vitest";
import type { LetterDefinition, LineSegment, Point } from "../../../types";
import { letters as uppercaseLetters } from "../../../data/letterSegments/english/capitalLetters";
import { letters as lowercaseLetters } from "../../../data/letterSegments/english/lowercaseLetters";
import {
  computeBoundaryBox,
  computeCoverage,
  curvePointAt,
  isCurvedSegment,
  isPointInBox,
} from "../geometry";
import { evaluateSegmentPath } from "../scoring";

// Golden-master guard for the geometry/scoring rewrite (task 010): every authored tracable
// segment must be completable by tracing its ideal path, and the coverage/containment numbers
// for that path are frozen in a snapshot so refactors cannot silently shift scoring.

const PATH_STEPS = 30;
const PREFIX_STRIDE = 3;
const PROBE_OFFSETS: Point[] = [
  { x: 0.03, y: 0 },
  { x: 0, y: 0.03 },
  { x: 0.1, y: 0 },
  { x: 0, y: 0.1 },
];

function pointOnSegment(segment: LineSegment, t: number): Point {
  if (isCurvedSegment(segment)) return curvePointAt(segment, t);
  return {
    x: segment.start.x + (segment.end.x - segment.start.x) * t,
    y: segment.start.y + (segment.end.y - segment.start.y) * t,
  };
}

function idealPath(segment: LineSegment): Point[] {
  const points: Point[] = [];
  for (let i = 0; i <= PATH_STEPS; i++) {
    points.push(pointOnSegment(segment, i / PATH_STEPS));
  }
  return points;
}

// Mirrors useSegmentTrace: evaluate while dragging, then once more on finger-up.
function simulateDrag(points: Point[], segment: LineSegment) {
  for (let n = 2; n <= points.length; n += PREFIX_STRIDE) {
    const outcome = evaluateSegmentPath(points.slice(0, n), segment, false);
    if (outcome.kind !== "in-progress") return { kind: outcome.kind, at: n };
  }
  return {
    kind: evaluateSegmentPath(points, segment, true).kind,
    at: points.length,
  };
}

const round = (value: number) => Math.round(value * 1e4) / 1e4;

function characterize(letter: LetterDefinition) {
  return letter.segments.flatMap((segment, index) => {
    if (segment.isTracable === false) return [];
    const path = idealPath(segment);
    const box = computeBoundaryBox(segment);
    const mid = pointOnSegment(segment, 0.5);
    return [
      {
        segment: index,
        drag: simulateDrag(path, segment),
        halfCoverage: round(
          computeCoverage(path.slice(0, PATH_STEPS / 2 + 1), segment),
        ),
        fullCoverage: round(computeCoverage(path, segment)),
        probesInBox: PROBE_OFFSETS.map((o) =>
          isPointInBox({ x: mid.x + o.x, y: mid.y + o.y }, box),
        ),
      },
    ];
  });
}

describe.each([
  ["uppercase", uppercaseLetters],
  ["lowercase", lowercaseLetters],
])("Authored %s letters (characterization)", (_label, letters) => {
  it.each(letters.map((l) => [l.id, l] as const))(
    "letter %s: ideal traces complete and scoring numbers are stable",
    (_id, letter) => {
      const result = characterize(letter);
      for (const segment of result) {
        expect(segment.drag.kind, `segment ${segment.segment}`).toBe(
          "complete",
        );
      }
      expect(result).toMatchSnapshot();
    },
  );
});
