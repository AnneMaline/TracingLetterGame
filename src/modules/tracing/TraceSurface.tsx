import { useCallback, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { LetterDefinition, Point } from "../../types";
import { SegmentGuide } from "./SegmentGuide";
import type { SegmentTraceView } from "./useSegmentTrace";

interface Props {
  letter: LetterDefinition;
  view: SegmentTraceView;
  onPointerDown: (p: Point) => void;
  onPointerMove: (p: Point) => void;
  onPointerUp: () => void;
}

const VIEWBOX_SIZE = 400;

export function TraceSurface({
  letter,
  view,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const activePointerId = useRef<number | null>(null);

  const toNormalized = useCallback(
    (clientX: number, clientY: number): Point | null => {
      const svg = svgRef.current;
      if (!svg) return null;
      const rect = svg.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;
      return {
        x: (clientX - rect.left) / rect.width,
        y: (clientY - rect.top) / rect.height,
      };
    },
    [],
  );

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      if (activePointerId.current !== null) return;
      const p = toNormalized(e.clientX, e.clientY);
      if (!p) return;
      activePointerId.current = e.pointerId;
      e.currentTarget.setPointerCapture(e.pointerId);
      onPointerDown(p);
    },
    [onPointerDown, toNormalized],
  );

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      if (activePointerId.current !== e.pointerId) return;
      const p = toNormalized(e.clientX, e.clientY);
      if (!p) return;
      onPointerMove(p);
    },
    [onPointerMove, toNormalized],
  );

  const finishPointer = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      if (activePointerId.current !== e.pointerId) return;
      activePointerId.current = null;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      onPointerUp();
    },
    [onPointerUp],
  );

  const currentSegment = letter.segments[view.currentSegmentIndex];

  const feedbackVisible = view.status === "tracing" && view.points.length > 1;
  const feedbackPath = feedbackVisible
    ? "M " + view.points.map((p) => `${p.x} ${p.y}`).join(" L ")
    : null;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 1 1`}
      preserveAspectRatio="xMidYMid meet"
      width={VIEWBOX_SIZE}
      height={VIEWBOX_SIZE}
      role="img"
      aria-label={`Trace the letter ${letter.displayLabel}`}
      data-testid="trace-surface"
      data-letter-id={letter.id}
      data-segment-status={view.status}
      data-segment-index={view.currentSegmentIndex}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishPointer}
      onPointerCancel={finishPointer}
      onPointerLeave={(e) => {
        if (activePointerId.current === e.pointerId) finishPointer(e);
      }}
      style={{
        touchAction: "none",
        background: "#fffdf6",
        border: "2px solid #d8ccb3",
        borderRadius: 16,
        display: "block",
        maxWidth: "80vmin",
        maxHeight: "80vmin",
        width: "min(80vmin, 480px)",
        height: "min(80vmin, 480px)",
      }}
    >
      {letter.segments.map((seg, i) => {
        if (!view.completedSegments[i]) return null;
        return (
          <line
            key={i}
            x1={seg.start.x}
            y1={seg.start.y}
            x2={seg.end.x}
            y2={seg.end.y}
            stroke="#3aa856"
            strokeWidth={0.03}
            strokeLinecap="round"
            data-testid={`completed-segment-${i}`}
          />
        );
      })}

      {currentSegment && view.status !== "letter-complete" && (
        <SegmentGuide segment={currentSegment} />
      )}

      {feedbackPath && (
        <path
          d={feedbackPath}
          fill="none"
          stroke="#e07b39"
          strokeWidth={0.035}
          strokeLinecap="round"
          strokeLinejoin="round"
          data-testid="trace-feedback"
        />
      )}
    </svg>
  );
}
