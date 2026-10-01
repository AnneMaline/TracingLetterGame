import type { LineSegment } from "../../types";
import {
  END_REGION_RADIUS,
  START_MARKER_RADIUS,
} from "../../shared/constants";
import {
  curvePointAt,
  curveSvgPath,
  isCurvedSegment,
  segmentTangentAt,
} from "./geometry";

interface Props {
  segment: LineSegment;
}

const calculateArrowPosition = ({
  segment,
  t = isCurvedSegment(segment) ? 0.2 : 0.5,
}: {
  segment: LineSegment;
  t?: number;
}) => {
  const arrowSize = 0.04;
  const arrowLengthCurve = 0.08;

  const { start, end } = segment;
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  let arrowTipX = 0;
  let arrowTipY = 0;
  let ux = 0;
  let uy = 0;

  if (isCurvedSegment(segment)) {
    const p = curvePointAt(segment, t);
    const tangent = segmentTangentAt(segment, t);
    arrowTipX = p.x;
    arrowTipY = p.y;
    ux = tangent?.x ?? 1;
    uy = tangent?.y ?? 0;
  } else {
    // Line
    const len = Math.hypot(dx, dy) || 1;
    ux = dx / len;
    uy = dy / len;
    arrowTipX = start.x + dx * t + ux * arrowSize;
    arrowTipY = start.y + dy * t + uy * arrowSize;
  }

  // Return
  const arrowBaseX = isCurvedSegment(segment)
    ? arrowTipX - ux * arrowLengthCurve
    : start.x + dx * t - ux * arrowSize;
  const arrowBaseY = isCurvedSegment(segment)
    ? arrowTipY - uy * arrowLengthCurve
    : start.y + dy * t - uy * arrowSize;
  const perpX = -uy * arrowSize * 0.75;
  const perpY = ux * arrowSize * 0.75;

  return `${arrowTipX},${arrowTipY} ${arrowBaseX + perpX},${arrowBaseY + perpY} ${arrowBaseX - perpX},${arrowBaseY - perpY}`;
};

export function SegmentGuide({ segment }: Props) {
  const { start, end } = segment;

  return (
    <g data-testid="segment-guide">
      {isCurvedSegment(segment) ? (
        <path
          d={curveSvgPath(segment)}
          fill="none"
          stroke="#c0d3e7"
          strokeWidth={0.02}
          strokeLinecap="round"
          strokeDasharray="0.03 0.02"
        />
      ) : (
        <line
          x1={start.x}
          y1={start.y}
          x2={end.x}
          y2={end.y}
          stroke="#c0d3e7"
          strokeWidth={0.02}
          strokeLinecap="round"
          strokeDasharray="0.03 0.02"
          data-testid="segment-guide-line"
        />
      )}
      <circle
        cx={end.x}
        cy={end.y}
        r={END_REGION_RADIUS}
        fill="none"
        stroke="#e07b39"
        strokeWidth={0.012}
        data-testid="segment-guide-end"
      />
      <circle
        cx={start.x}
        cy={start.y}
        r={START_MARKER_RADIUS}
        fill="#3aa856"
        data-testid="segment-guide-start"
      />
      <polygon
        points={calculateArrowPosition({ segment })}
        fill="#17324d"
        data-testid="segment-guide-arrow"
      />
      {isCurvedSegment(segment) && (
        <polygon
          points={calculateArrowPosition({ segment, t: 0.9 })}
          fill="#17324d"
          data-testid="segment-guide-arrow-secondary"
        />
      )}
    </g>
  );
}
