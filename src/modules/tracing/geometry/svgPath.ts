import type { LineSegment } from "../../../types";
import { curvePointAt } from "./curves";
import { stadiumSvgPath } from "./stadium";

const PATH_STEPS = 96;
const pathCache = new WeakMap<LineSegment, string>();

// SVG `d` attribute for a curved segment: exact arcs for stadiums, a dense polyline otherwise.
export function curveSvgPath(segment: LineSegment): string {
  const cached = pathCache.get(segment);
  if (cached !== undefined) return cached;

  let d: string;
  if (segment.curveKind === "oval" || segment.curveKind === "polyline") {
    const parts: string[] = [];
    for (let i = 0; i <= PATH_STEPS; i++) {
      const p = curvePointAt(segment, i / PATH_STEPS);
      parts.push(`${i === 0 ? "M" : "L"} ${p.x} ${p.y}`);
    }
    d = parts.join(" ");
  } else {
    d = stadiumSvgPath(segment);
  }
  pathCache.set(segment, d);
  return d;
}
