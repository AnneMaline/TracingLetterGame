import type { LineSegment } from "../../types";

interface Props {
  segment: LineSegment;
}

export function SegmentGuide({ segment }: Props) {
  const { start, end } = segment;
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;

  const arrowSize = 0.04;
  const arrowTipX = midX + ux * arrowSize;
  const arrowTipY = midY + uy * arrowSize;
  const arrowBaseX = midX - ux * arrowSize;
  const arrowBaseY = midY - uy * arrowSize;
  const perpX = -uy * arrowSize * 0.6;
  const perpY = ux * arrowSize * 0.6;

  return (
    <g data-testid="segment-guide">
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
      <circle
        cx={start.x}
        cy={start.y}
        r={0.05}
        fill="#3aa856"
        data-testid="segment-guide-start"
      />
      <circle
        cx={end.x}
        cy={end.y}
        r={0.035}
        fill="none"
        stroke="#e07b39"
        strokeWidth={0.012}
        data-testid="segment-guide-end"
      />
      <polygon
        points={`${arrowTipX},${arrowTipY} ${arrowBaseX + perpX},${arrowBaseY + perpY} ${arrowBaseX - perpX},${arrowBaseY - perpY}`}
        fill="#17324d"
        data-testid="segment-guide-arrow"
      />
    </g>
  );
}
