export interface Point {
  x: number;
  y: number;
}

export interface BezierSegment {
  control1: Point;
  control2: Point;
  end: Point;
}

export interface LineSegment {
  start: Point;
  end: Point;
  boundaryHalfWidth?: number;
  isCurve?: boolean;
  curveControlX?: number;
  curveKind?: "bezier" | "oval" | "polyline" | "spline";
  bezierSegments?: BezierSegment[];
  polylinePoints?: Point[];
  splinePoints?: Point[];
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
