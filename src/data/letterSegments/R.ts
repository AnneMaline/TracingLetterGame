import type { LetterDefinition } from "../../types";

const letterR: LetterDefinition = {
  id: "R",
  displayLabel: "R",
  segments: [
    { start: { x: 0.25, y: 0.14 }, end: { x: 0.25, y: 0.86 } },
    {
      start: { x: 0.25, y: 0.14 },
      end: { x: 0.6, y: 0.86 },
      isCurve: true,
      curveKind: "polyline",
      polylinePoints: [
        { x: 0.50, y: 0.14 },
        { x: 0.68, y: 0.28 },
        { x: 0.58, y: 0.46 },
        { x: 0.25, y: 0.50 },
      ],
    },
  ],
};

export default letterR;
