import { useCallback, useEffect, useState } from "react";
import type { LetterDefinition, LineSegment } from "../../types";
import {
  CELEBRATION_DELAY_MS,
  HARD_MODE_PREVIEW_MS,
} from "../../shared/constants";
import { Celebration } from "../celebration/Celebration";
import { TraceSurface } from "./TraceSurface";
import { useSegmentTrace } from "./useSegmentTrace";

interface Props {
  letter: LetterDefinition;
  isHardMode?: boolean;
  showHelplines?: boolean;
}

const isTracable = (s: LineSegment) => s.isTracable !== false;
const ignorePointer = () => {};

// Mounted with `key={letter.id}`, so all per-letter state (including the Hard mode preview)
// starts fresh for every letter.
export function LetterTracer({
  letter,
  isHardMode = false,
  showHelplines = false,
}: Props) {
  const { view, onPointerDown, onPointerMove, onPointerUp, reset } =
    useSegmentTrace(letter);
  const tracableTotal = letter.segments.filter(isTracable).length;
  const tracableIndex = letter.segments
    .slice(0, view.currentSegmentIndex + 1)
    .filter(isTracable).length;

  // Easy mode: shadow always on. Hard mode: shadow-only preview, then shadow off.
  const [isPreviewing, setIsPreviewing] = useState(isHardMode);
  useEffect(() => {
    if (!isPreviewing) return;
    const timer = setTimeout(
      () => setIsPreviewing(false),
      HARD_MODE_PREVIEW_MS,
    );
    return () => clearTimeout(timer);
  }, [isPreviewing]);
  const canTrace = !isPreviewing;
  const shadowVisible = !isHardMode || isPreviewing;

  const [celebrationVisible, setCelebrationVisible] = useState(false);
  useEffect(() => {
    if (view.status !== "letter-complete") return;
    const timer = setTimeout(
      () => setCelebrationVisible(true),
      CELEBRATION_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [view.status]);

  const onCelebrationDone = useCallback(() => {
    setCelebrationVisible(false);
    reset();
  }, [reset]);

  return (
    <>
      <p style={{ margin: 0, color: "#4a5b6f" }} data-testid="progress-label">
        Segment {Math.min(tracableIndex, tracableTotal)} of {tracableTotal}
      </p>
      <div style={{ position: "relative" }} data-testid="tracer-viewport">
        <TraceSurface
          letter={letter}
          view={view}
          onPointerDown={canTrace ? onPointerDown : ignorePointer}
          onPointerMove={canTrace ? onPointerMove : ignorePointer}
          onPointerUp={canTrace ? onPointerUp : ignorePointer}
          showShadow={shadowVisible}
          showHelplines={showHelplines}
          canTrace={canTrace}
        />
        <Celebration
          visible={celebrationVisible}
          onComplete={onCelebrationDone}
        />
      </div>
    </>
  );
}
