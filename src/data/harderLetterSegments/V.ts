import type { LetterDefinition } from "../../types";

const letterV: LetterDefinition = {
  id: "V",
  displayLabel: "V",
  segments: [
    {
      start: { x: 0.2, y: 0.14 },
      end: { x: 0.8, y: 0.14 },
      isCurve: true,
      curveKind: "polyline",
      polylinePoints: [{ x: 0.5, y: 0.86 }],
    },
  ],
};

export default letterV;
