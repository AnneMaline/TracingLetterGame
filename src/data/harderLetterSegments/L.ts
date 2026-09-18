import type { LetterDefinition } from "../../types";

const letterL: LetterDefinition = {
  id: "L",
  displayLabel: "L",
  segments: [
    {
      start: { x: 0.34, y: 0.14 },
      end: { x: 0.76, y: 0.84 },
      isCurve: true,
      curveKind: "polyline",
      polylinePoints: [{ x: 0.34, y: 0.84 }],
    },
  ],
};

export default letterL;
