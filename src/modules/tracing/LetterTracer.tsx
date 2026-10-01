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
  showShadow?: boolean;
  isHardMode?: boolean;
  showHelplines?: boolean;
}

export function LetterTracer({
  letter,
  showShadow = true,
  isHardMode = false,
  showHelplines = false,
}: Props) {
  const trace = useSegmentTrace(letter);
  const { view } = trace;
  const isTracable = (s: LineSegment) => s.isTracable !== false;
  const tracableTotal = letter.segments.filter(isTracable).length;
  const tracableIndex = letter.segments
    .slice(0, view.currentSegmentIndex + 1)
    .filter(isTracable).length;
  const [shadowPreviewVisible, setShadowPreviewVisible] = useState(isHardMode);

  useEffect(() => {
    if (!isHardMode) {
      setShadowPreviewVisible(false);
      return;
    }

    setShadowPreviewVisible(true);
    const timer = setTimeout(
      () => setShadowPreviewVisible(false),
      HARD_MODE_PREVIEW_MS,
    );
    return () => clearTimeout(timer);
  }, [isHardMode, letter.id]);

  const canTrace = !isHardMode || !shadowPreviewVisible;
  const shadowVisible = isHardMode ? shadowPreviewVisible : showShadow;

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
    trace.reset();
  }, [trace]);

  const handlePointerDown = useCallback(
    (p: { x: number; y: number }) => {
      if (!canTrace) return;
      trace.onPointerDown(p);
    },
    [canTrace, trace],
  );

  const handlePointerMove = useCallback(
    (p: { x: number; y: number }) => {
      if (!canTrace) return;
      trace.onPointerMove(p);
    },
    [canTrace, trace],
  );

  const handlePointerUp = useCallback(() => {
    if (!canTrace) return;
    trace.onPointerUp();
  }, [canTrace, trace]);

  return (
    <>
      <p style={{ margin: 0, color: "#4a5b6f" }} data-testid="progress-label">
        Segment {Math.min(tracableIndex, tracableTotal)} of {tracableTotal}
      </p>
      <div style={{ position: "relative" }} data-testid="tracer-viewport">
        <TraceSurface
          letter={letter}
          view={view}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
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
