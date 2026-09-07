import { useCallback, useEffect, useState } from "react";
import type { LetterDefinition } from "../../types";
import { Celebration } from "../celebration/Celebration";
import { TraceSurface } from "./TraceSurface";
import { useSegmentTrace } from "./useSegmentTrace";

interface Props {
  letter: LetterDefinition;
}

export function LetterTracer({ letter }: Props) {
  const trace = useSegmentTrace(letter);
  const { view } = trace;

  const [celebrationVisible, setCelebrationVisible] = useState(false);
  useEffect(() => {
    if (view.status !== "letter-complete") return;
    const timer = setTimeout(() => setCelebrationVisible(true), 500);
    return () => clearTimeout(timer);
  }, [view.status]);

  const onCelebrationDone = useCallback(() => {
    setCelebrationVisible(false);
    trace.reset();
  }, [trace]);

  return (
    <>
      <p style={{ margin: 0, color: "#4a5b6f" }} data-testid="progress-label">
        Segment {Math.min(view.currentSegmentIndex + 1, letter.segments.length)}{" "}
        of {letter.segments.length}
      </p>
      <div style={{ position: "relative" }} data-testid="tracer-viewport">
        <TraceSurface
          letter={letter}
          view={view}
          onPointerDown={trace.onPointerDown}
          onPointerMove={trace.onPointerMove}
          onPointerUp={trace.onPointerUp}
        />
        <Celebration
          visible={celebrationVisible}
          onComplete={onCelebrationDone}
        />
      </div>
    </>
  );
}
