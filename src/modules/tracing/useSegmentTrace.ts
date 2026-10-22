import { useCallback, useEffect, useRef, useState } from "react";
import type { LetterDefinition, LineSegment, Point } from "../../types";
import {
  END_REGION_RADIUS,
  MIN_SEGMENT_COVERAGE,
  RESUME_MIN_COVERAGE,
  SEGMENT_ADVANCE_DELAY_MS,
  START_REGION_RADIUS,
} from "../../shared/constants";
import { distanceBetween, segmentPointAt } from "./geometry";
import { evaluateSegmentPath } from "./scoring";

export type SegmentStatus =
  | "awaiting-start"
  | "tracing"
  | "segment-reset"
  | "segment-paused"
  | "segment-complete"
  | "letter-complete";

export interface SegmentTraceView {
  status: SegmentStatus;
  currentSegmentIndex: number;
  completedSegments: boolean[];
  points: readonly Point[];
  coverage: number;
  isWithinBoundaryBox: boolean;
  // Progress the child can resume from after lifting mid-segment (status "segment-paused").
  resumeT: number | null;
  // Increments on every ignored pointer-down while waiting, so the UI can replay the demo.
  wrongStartCount: number;
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
  const [resumeT, setResumeT] = useState<number | null>(null);
  const [attemptStartT, setAttemptStartT] = useState(0);
  const [wrongStartCount, setWrongStartCount] = useState(0);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (advanceTimer.current !== null) clearTimeout(advanceTimer.current);
    },
    [],
  );

  const currentSegment = letter.segments[currentSegmentIndex];

  const clearAttempt = useCallback(() => {
    setPoints([]);
    setCoverage(0);
    setWithin(false);
    setResumeT(null);
    setAttemptStartT(0);
  }, []);

  const advanceOrComplete = useCallback(
    (candidateIndex: number) => {
      const nextIndex = nextTracableIndex(letter.segments, candidateIndex);
      if (nextIndex >= letter.segments.length) {
        setStatus("letter-complete");
      } else {
        setCurrentSegmentIndex(nextIndex);
        setStatus("awaiting-start");
      }
      clearAttempt();
    },
    [letter.segments, clearAttempt],
  );

  const resetSegment = useCallback(() => {
    setStatus("segment-reset");
    clearAttempt();
  }, [clearAttempt]);

  const completeSegment = useCallback(() => {
    setCompletedSegments((prev) => {
      const nextCompleted = [...prev];
      nextCompleted[currentSegmentIndex] = true;
      return nextCompleted;
    });
    setStatus("segment-complete");
    const nextIndex = currentSegmentIndex + 1;
    advanceTimer.current = setTimeout(
      () => advanceOrComplete(nextIndex),
      SEGMENT_ADVANCE_DELAY_MS,
    );
  }, [advanceOrComplete, currentSegmentIndex]);

  const onPointerDown = useCallback(
    (p: Point) => {
      if (!currentSegment) return;
      if (
        status !== "awaiting-start" &&
        status !== "segment-reset" &&
        status !== "segment-paused"
      ) {
        return;
      }
      const toStart = distanceBetween(p, currentSegment.start);
      const toResume =
        resumeT === null
          ? Number.POSITIVE_INFINITY
          : distanceBetween(p, segmentPointAt(currentSegment, resumeT));
      let startT: number;
      if (toResume <= START_REGION_RADIUS && toResume <= toStart) {
        startT = resumeT ?? 0;
      } else if (toStart <= START_REGION_RADIUS) {
        startT = 0;
      } else {
        setWrongStartCount((n) => n + 1);
        return;
      }
      setAttemptStartT(startT);
      setResumeT(null);
      setPoints([p]);
      setCoverage(startT);
      setWithin(true);
      setStatus("tracing");
    },
    [currentSegment, resumeT, status],
  );

  const onPointerMove = useCallback(
    (p: Point) => {
      if (!currentSegment) return;
      if (status !== "tracing") return;

      const next = [...points, p];
      const outcome = evaluateSegmentPath(next, currentSegment, false, {
        startT: attemptStartT,
      });
      if (outcome.kind === "exit-box" || outcome.kind === "deviation-reset") {
        resetSegment();
        setCoverage(outcome.coverage);
        return;
      }

      if (outcome.kind === "complete") {
        setPoints(next);
        setCoverage(outcome.coverage);
        setWithin(true);
        completeSegment();
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
    [
      attemptStartT,
      completeSegment,
      currentSegment,
      points,
      resetSegment,
      status,
    ],
  );

  const onPointerUp = useCallback(() => {
    if (!currentSegment) return;
    if (status !== "tracing") return;

    const outcome = evaluateSegmentPath(points, currentSegment, true, {
      startT: attemptStartT,
    });
    if (outcome.kind === "complete") {
      setCoverage(outcome.coverage);
      completeSegment();
    } else if (
      outcome.kind === "reset" &&
      outcome.coverage >= RESUME_MIN_COVERAGE
    ) {
      // Lifting keeps progress; the child continues from the resume dot.
      setStatus("segment-paused");
      setPoints([]);
      setWithin(false);
      setCoverage(outcome.coverage);
      setResumeT(outcome.coverage);
    } else {
      resetSegment();
      setCoverage(outcome.coverage);
    }
  }, [
    attemptStartT,
    completeSegment,
    currentSegment,
    points,
    resetSegment,
    status,
  ]);

  const reset = useCallback(() => {
    setCurrentSegmentIndex(nextTracableIndex(letter.segments, 0));
    setCompletedSegments(initialCompleted(letter.segments));
    setStatus("awaiting-start");
    clearAttempt();
  }, [letter.segments, clearAttempt]);

  return {
    view: {
      status,
      currentSegmentIndex,
      completedSegments,
      points,
      coverage,
      isWithinBoundaryBox,
      resumeT,
      wrongStartCount,
    },
    onPointerDown,
    onPointerMove,
    onPointerUp,
    reset,
  };
}
