// Public tracing-geometry API. Import from "./geometry", not from the individual files.
export type { BoundaryBox } from "./boundary";
export type { UnitVector } from "./vector";
export {
  computeBoundaryBox,
  getSegmentPadding,
  isDegenerate,
  isPointInBox,
  segmentLength,
} from "./boundary";
export { shouldSuppressDeviationAtPolylineCorner } from "./corners";
export {
  curvePointAt,
  isCurvedSegment,
  segmentDirection,
  segmentTangentAt,
} from "./curves";
export { isClosedLoopSegment, wrapLoopT } from "./oval";
export {
  computeCoverage,
  coverageFromProgress,
  projectPathProgressively,
  projectPointOntoSegment,
} from "./projection";
export { curveSvgPath } from "./svgPath";
export {
  angleBetweenDegrees,
  computeDragDirection,
  distanceBetween,
} from "./vector";
