import type { LetterDefinition } from "../../types";

const letterK: LetterDefinition = {
  id: "K",
  displayLabel: "K",
  segments: [
    { start: { x: 0.25, y: 0.14 }, end: { x: 0.25, y: 0.86 } },
    {
      start: { x: 0.65, y: 0.14 },
      end: { x: 0.65, y: 0.86 },
      isCurve: true,
      curveKind: "polyline",
      polylinePoints: [{ x: 0.25, y: 0.50 }],
    },
  ],
};

export default letterK;
