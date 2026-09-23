export interface Point {
  x: number;
  y: number;
}

export interface LineValues {
  start: Point;
  end: Point;
  isCurve?: boolean;
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
  isCurve?: boolean;
  curveKind?: "oval" | "polyline";
  polylinePoints?: PolylinePoint[];
}

export interface LetterDefinition {
  id: string;
  displayLabel: string;
  segments: LineSegment[];
}
