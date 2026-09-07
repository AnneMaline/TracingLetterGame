import { useCallback, useMemo, useState } from "react";
import type { LetterDefinition, Point } from "../../types";
import { computeBoundaryBox, isPointInBox } from "./geometry";
import { evaluatePath } from "./scoring";

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

export function useSegmentTrace(letter: LetterDefinition): SegmentTraceApi {
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [completedSegments, setCompletedSegments] = useState<boolean[]>(() =>
    letter.segments.map(() => false),
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
    (nextIndex: number) => {
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
    [letter.segments.length],
  );

  const onPointerDown = useCallback(
    (p: Point) => {
      if (!currentSegment || !box) return;
      if (status !== "awaiting-start" && status !== "segment-reset") return;
      if (!isPointInBox(p, box)) return;
      setPoints([p]);
      setCoverage(0);
      setWithin(true);
      setStatus("tracing");
    },
    [box, currentSegment, status],
  );

  const onPointerMove = useCallback(
    (p: Point) => {
      if (status !== "tracing" || !currentSegment) return;
      setPoints((prev) => {
        const next = [...prev, p];
        const outcome = evaluatePath(next, currentSegment, false);
        if (outcome.kind === "exit-box") {
          setCoverage(outcome.coverage);
          setWithin(false);
          setStatus("segment-reset");
          return [];
        }
        setCoverage(outcome.kind === "in-progress" ? outcome.coverage : 0);
        setWithin(true);
        return next;
      });
    },
    [currentSegment, status],
  );

  const onPointerUp = useCallback(() => {
    if (status !== "tracing" || !currentSegment) return;
    const outcome = evaluatePath(points, currentSegment, true);
    setCoverage(outcome.coverage);
    if (outcome.kind === "complete") {
      const nextCompleted = [...completedSegments];
      nextCompleted[currentSegmentIndex] = true;
      setCompletedSegments(nextCompleted);
      setStatus("segment-complete");
      const nextIndex = currentSegmentIndex + 1;
      setTimeout(() => advanceOrComplete(nextIndex), 250);
    } else if (outcome.kind === "reset" || outcome.kind === "exit-box") {
      setStatus("segment-reset");
      setPoints([]);
      setCoverage(0);
      setWithin(false);
    }
  }, [
    advanceOrComplete,
    completedSegments,
    currentSegment,
    currentSegmentIndex,
    points,
    status,
  ]);

  const reset = useCallback(() => {
    setCurrentSegmentIndex(0);
    setCompletedSegments(letter.segments.map(() => false));
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
