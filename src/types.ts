export interface Point {
  x: number;
  y: number;
}

export interface LineSegment {
  start: Point;
  end: Point;
  boundaryHalfWidth?: number;
  isCurve?: boolean;
  curveControlX?: number;
  curveKind?: "cubic" | "oval" | "polyline";
  polylinePoints?: Point[];
  ovalCenter?: Point;
  ovalRadiusX?: number;
  ovalRadiusY?: number;
  ovalStartAngleDeg?: number;
  ovalEndAngleDeg?: number;
  ovalCounterClockwise?: boolean;
}

export interface LetterDefinition {
  id: string;
  displayLabel: string;
  segments: LineSegment[];
}

export interface SegmentTraceState {
  points: Point[];
  isWithinBoundaryBox: boolean;
  progressAlongVector: number;
}

export interface LetterSessionState {
  letterIndex: number;
  currentSegmentIndex: number;
  completedSegments: boolean[];
}
