import { useEffect, useRef } from "react";
import type { LineSegment } from "../../types";
import {
  DEMO_DOT_RADIUS,
  DEMO_GLIDE_MS,
  DEMO_IDLE_MS,
  START_MARKER_RADIUS,
} from "../../shared/constants";
import {
  getSegmentPadding,
  segmentPathUpTo,
  segmentPointAt,
  segmentSvgPath,
} from "./geometry";
import { SegmentShape } from "./SegmentShape";

interface SegmentProps {
  segment: LineSegment;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// The allowed tracing area (boundary box) drawn as a soft "bubble" band.
export function CorridorBand({ segment }: SegmentProps) {
  return (
    <g
      stroke="#e8f4ea"
      strokeWidth={2 * getSegmentPadding(segment)}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      pointerEvents="none"
      data-testid="corridor-band"
    >
      <SegmentShape segment={segment} />
    </g>
  );
}

// The covered part of the active segment, from its start to the coverage frontier.
export function ProgressFill({
  segment,
  coverage,
}: SegmentProps & { coverage: number }) {
  const points = segmentPathUpTo(segment, coverage)
    .map((p) => `${p.x},${p.y}`)
    .join(" ");
  return (
    <polyline
      points={points}
      fill="none"
      stroke="#3aa856"
      strokeWidth={0.03}
      strokeLinecap="round"
      strokeLinejoin="round"
      pointerEvents="none"
      data-testid="progress-fill"
    />
  );
}

export function ResumeMarker({
  segment,
  resumeT,
}: SegmentProps & { resumeT: number }) {
  const p = segmentPointAt(segment, resumeT);
  return (
    <circle
      cx={p.x}
      cy={p.y}
      r={START_MARKER_RADIUS}
      fill="#3aa856"
      className="trace-pulse"
      pointerEvents="none"
      data-testid="resume-marker"
    />
  );
}

// A dot that glides along the segment from `fromT` to the end, then waits and repeats.
// Remount (new `key`) to restart it from the beginning.
export function DemoDot({ segment, fromT }: SegmentProps & { fromT: number }) {
  const motionRef = useRef<SVGAnimateMotionElement>(null);
  const fadeRef = useRef<SVGAnimateElement>(null);
  useEffect(() => {
    // SMIL timing is relative to document load; start explicitly when the dot mounts.
    for (const el of [motionRef.current, fadeRef.current]) {
      if (el && typeof el.beginElement === "function") el.beginElement();
    }
  }, []);

  if (prefersReducedMotion()) return null;

  const cycleMs = DEMO_GLIDE_MS + DEMO_IDLE_MS;
  const glide = DEMO_GLIDE_MS / cycleMs;
  const dur = `${cycleMs / 1000}s`;
  return (
    <circle
      cx={0}
      cy={0}
      r={DEMO_DOT_RADIUS}
      fill="#ffb703"
      stroke="#17324d"
      strokeWidth={0.006}
      opacity={0}
      pointerEvents="none"
      data-testid="demo-dot"
    >
      <animateMotion
        ref={motionRef}
        path={segmentSvgPath(segment)}
        begin="indefinite"
        dur={dur}
        repeatCount="indefinite"
        calcMode="spline"
        keyPoints={`${fromT};1;1`}
        keyTimes={`0;${glide};1`}
        keySplines="0.42 0 0.58 1;0 0 1 1"
      />
      <animate
        ref={fadeRef}
        attributeName="opacity"
        begin="indefinite"
        dur={dur}
        repeatCount="indefinite"
        values="1;1;0;0"
        keyTimes={`0;${glide};${glide + 0.02};1`}
      />
    </circle>
  );
}
