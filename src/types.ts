export interface Point {
  x: number;
  y: number;
}

export interface LineValues {
  start: Point;
  end: Point;
  isCurve?: boolean;
  curveKind?: "oval" | "polyline";
  curveControlX?: number;
  ovalCenter?: Point;
  ovalRadiusX?: number;
  ovalRadiusY?: number;
  ovalStartAngleDeg?: number;
  ovalEndAngleDeg?: number;
  ovalCounterClockwise?: boolean;
}

export type PolylinePoint = Point | LineValues;

export interface LineSegment extends LineValues {
  boundaryHalfWidth?: number;
  /** When false, the segment is pre-filled and skipped during tracing. Defaults to true. */
  isTracable?: boolean;
  polylinePoints?: PolylinePoint[];
}

export type LetterCase = "uppercase" | "lowercase";

export interface LetterDefinition {
  id: string;
  displayLabel: string;
  segments: LineSegment[];
}
