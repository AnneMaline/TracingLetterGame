import { useCallback, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { LetterDefinition, Point } from "../../types";
import { LOWERCASE_CANVAS_HEIGHT } from "../../shared/constants";
import { Helplines } from "./Helplines";
import { SegmentGuide } from "./SegmentGuide";
import { SegmentShape } from "./SegmentShape";
import type { SegmentTraceView } from "./useSegmentTrace";

interface Props {
  letter: LetterDefinition;
  view: SegmentTraceView;
  onPointerDown: (p: Point) => void;
  onPointerMove: (p: Point) => void;
  onPointerUp: () => void;
  showShadow?: boolean;
  showHelplines?: boolean;
  canTrace?: boolean;
}

const VIEWBOX_SIZE = 400;

function isLowercaseLetter(letter: LetterDefinition): boolean {
  return /^[a-z]$/.test(letter.id);
}

function getViewBoxHeight(isLowercase: boolean): number {
  return isLowercase ? LOWERCASE_CANVAS_HEIGHT : 1;
}

export function TraceSurface({
  letter,
  view,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  showShadow = true,
  showHelplines = false,
  canTrace = true,
}: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const activePointerId = useRef<number | null>(null);
  const isLowercase = isLowercaseLetter(letter);
  const viewBoxHeight = getViewBoxHeight(isLowercase);

  const toNormalized = useCallback(
    (clientX: number, clientY: number): Point | null => {
      const svg = svgRef.current;
      if (!svg) return null;
      const rect = svg.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;

      // Match preserveAspectRatio="xMidYMid meet" with a dynamic viewBox height.
      const viewBoxWidth = 1;
      const scale = Math.min(
        rect.width / viewBoxWidth,
        rect.height / viewBoxHeight,
      );
      const renderedWidth = viewBoxWidth * scale;
      const renderedHeight = viewBoxHeight * scale;
      const offsetX = (rect.width - renderedWidth) / 2;
      const offsetY = (rect.height - renderedHeight) / 2;
      return {
        x: (clientX - rect.left - offsetX) / scale,
        y: (clientY - rect.top - offsetY) / scale,
      };
    },
    [viewBoxHeight],
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
      viewBox={`0 0 1 ${viewBoxHeight}`}
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
      {showHelplines && <Helplines isLowercase={isLowercase} />}

      {showShadow && (
        <g
          stroke="#dfe6ef"
          strokeWidth={0.022}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity={0.9}
          pointerEvents="none"
          data-testid="letter-shadow"
        >
          {letter.segments.map((seg, i) => (
            <SegmentShape key={i} segment={seg} />
          ))}
        </g>
      )}

      <g
        fill="none"
        stroke="#3aa856"
        strokeWidth={0.03}
        strokeLinecap="round"
        pointerEvents="none"
      >
        {letter.segments.map((seg, i) =>
          view.completedSegments[i] ? (
            <SegmentShape
              key={i}
              segment={seg}
              testId={`completed-segment-${i}`}
            />
          ) : null,
        )}
      </g>

      {canTrace && currentSegment && view.status !== "letter-complete" && (
        <SegmentGuide segment={currentSegment} />
      )}

      {canTrace && feedbackPath && (
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
