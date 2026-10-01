import type { LineSegment } from "../../types";
import { curveSvgPath, isCurvedSegment } from "./geometry";

interface Props {
  segment: LineSegment;
  testId?: string;
}

// Unstyled shape for one segment; stroke styling is inherited from the enclosing <g>.
export function SegmentShape({ segment, testId }: Props) {
  if (isCurvedSegment(segment)) {
    return <path d={curveSvgPath(segment)} data-testid={testId} />;
  }
  return (
    <line
      x1={segment.start.x}
      y1={segment.start.y}
      x2={segment.end.x}
      y2={segment.end.y}
      data-testid={testId}
    />
  );
}
