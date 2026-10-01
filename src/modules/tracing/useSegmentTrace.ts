import { useCallback, useMemo, useState } from "react";
import type { LetterDefinition, LineSegment, Point } from "../../types";
import {
  END_REGION_RADIUS,
  MIN_SEGMENT_COVERAGE,
  START_REGION_RADIUS,
} from "../../shared/constants";
import { computeBoundaryBox, distanceBetween, isPointInBox } from "./geometry";
import { evaluatePathM2 } from "./scoring";

export type SegmentStatus =
  | "awaiting-start"
  | "tracing"
  | "segment-reset"
  | "segment-complete"
  | "letter-complete";

export interface SegmentTraceView {
  status: SegmentStatus;
  currentSegmentIndex: number;
  completedSegments: boolean[];
  points: readonly Point[];
  coverage: number;
  isWithinBoundaryBox: boolean;
}

export interface SegmentTraceApi {
  view: SegmentTraceView;
  onPointerDown: (p: Point) => void;
  onPointerMove: (p: Point) => void;
  onPointerUp: () => void;
  reset: () => void;
}

function nextTracableIndex(segments: LineSegment[], from: number): number {
  let i = from;
  while (i < segments.length && segments[i].isTracable === false) i++;
  return i;
}

function initialCompleted(segments: LineSegment[]): boolean[] {
  return segments.map((s) => s.isTracable === false);
}

export function useSegmentTrace(letter: LetterDefinition): SegmentTraceApi {
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(() =>
    nextTracableIndex(letter.segments, 0),
  );
  const [completedSegments, setCompletedSegments] = useState<boolean[]>(() =>
    initialCompleted(letter.segments),
  );
  const [status, setStatus] = useState<SegmentStatus>("awaiting-start");
  const [points, setPoints] = useState<Point[]>([]);
  const [coverage, setCoverage] = useState(0);
  const [isWithinBoundaryBox, setWithin] = useState(false);

  const currentSegment = letter.segments[currentSegmentIndex];
  const box = useMemo(
    () => (currentSegment ? computeBoundaryBox(currentSegment) : null),
    [currentSegment],
  );

  const advanceOrComplete = useCallback(
    (candidateIndex: number) => {
      const nextIndex = nextTracableIndex(letter.segments, candidateIndex);
      if (nextIndex >= letter.segments.length) {
        setStatus("letter-complete");
      } else {
        setCurrentSegmentIndex(nextIndex);
        setStatus("awaiting-start");
      }
      setPoints([]);
      setCoverage(0);
      setWithin(false);
    },
    [letter.segments],
  );

  const resetSegment = useCallback(() => {
    setStatus("segment-reset");
    setPoints([]);
    setCoverage(0);
    setWithin(false);
  }, []);

  const completeSegment = useCallback(() => {
    setCompletedSegments((prev) => {
      const nextCompleted = [...prev];
      nextCompleted[currentSegmentIndex] = true;
      return nextCompleted;
    });
    setStatus("segment-complete");
    const nextIndex = currentSegmentIndex + 1;
    setTimeout(() => advanceOrComplete(nextIndex), 250);
  }, [advanceOrComplete, currentSegmentIndex]);

  const onPointerDown = useCallback(
    (p: Point) => {
      if (!currentSegment || !box) return;
      if (status !== "awaiting-start" && status !== "segment-reset") return;
      if (!isPointInBox(p, box)) return;
      if (distanceBetween(p, currentSegment.start) > START_REGION_RADIUS)
        return;
      setPoints([p]);
      setCoverage(0);
      setWithin(true);
      setStatus("tracing");
    },
    [box, currentSegment, status],
  );

  const onPointerMove = useCallback(
    (p: Point) => {
      if (!currentSegment || !box) return;
      if (status !== "tracing") return;

      const next = [...points, p];
      const outcome = evaluatePathM2(next, currentSegment, false);
      if (outcome.kind === "exit-box" || outcome.kind === "deviation-reset") {
        setCoverage(outcome.coverage);
        setWithin(false);
        setStatus("segment-reset");
        setPoints([]);
        return;
      }

      const currentCoverage =
        outcome.kind === "in-progress" ? outcome.coverage : 0;
      setPoints(next);
      setCoverage(currentCoverage);
      setWithin(true);

      if (
        currentCoverage >= MIN_SEGMENT_COVERAGE &&
        distanceBetween(p, currentSegment.end) <= END_REGION_RADIUS
      ) {
        completeSegment();
      }
    },
    [box, completeSegment, currentSegment, points, status],
  );

  const onPointerUp = useCallback(() => {
    if (!currentSegment) return;
    if (status !== "tracing") return;

    const outcome = evaluatePathM2(points, currentSegment, true);
    setCoverage(outcome.coverage);
    if (outcome.kind === "complete") {
      completeSegment();
    } else {
      resetSegment();
    }
  }, [completeSegment, currentSegment, points, resetSegment, status]);

  const reset = useCallback(() => {
    setCurrentSegmentIndex(nextTracableIndex(letter.segments, 0));
    setCompletedSegments(initialCompleted(letter.segments));
    setStatus("awaiting-start");
    setPoints([]);
    setCoverage(0);
    setWithin(false);
  }, [letter.segments]);

  return {
    view: {
      status,
      currentSegmentIndex,
      completedSegments,
      points,
      coverage,
      isWithinBoundaryBox,
    },
    onPointerDown,
    onPointerMove,
    onPointerUp,
    reset,
  };
}
