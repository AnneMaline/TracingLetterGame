import type { LetterDefinition } from "../../types";

const letterA: LetterDefinition = {
  id: "A",
  displayLabel: "A",
  segments: [
    {
      start: { x: 0.22, y: 0.86 },
      end: { x: 0.78, y: 0.86 },
      isCurve: true,
      curveKind: "polyline",
      polylinePoints: [{ x: 0.5, y: 0.12 }],
    },
    { start: { x: 0.34, y: 0.58 }, end: { x: 0.66, y: 0.58 } },
  ],
};

export default letterA;
