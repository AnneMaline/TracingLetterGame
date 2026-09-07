export interface Point {
  x: number;
  y: number;
}

export interface LineSegment {
  start: Point;
  end: Point;
  boundaryHalfWidth?: number;
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
