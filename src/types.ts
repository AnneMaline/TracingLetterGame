export interface Point {
  x: number;
  y: number;
}

export interface PolylineSubSegment {
  start: Point;
  end: Point;
  isCurve?: boolean;
  curveControlX?: number;
}

export type PolylinePoint = Point | PolylineSubSegment;

export interface LineSegment {
  start: Point;
  end: Point;
  boundaryHalfWidth?: number;
  isCurve?: boolean;
  curveControlX?: number;
  curveKind?: "oval" | "polyline";
  polylinePoints?: PolylinePoint[];
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
