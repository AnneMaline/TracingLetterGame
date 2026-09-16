import type { LetterDefinition } from "../../types";

const letterB: LetterDefinition = {
  id: "B",
  displayLabel: "B",
  segments: [
    { start: { x: 0.25, y: 0.14 }, end: { x: 0.25, y: 0.86 } },
    {
      start: { x: 0.25, y: 0.14 },
      end: { x: 0.25, y: 0.86 },
      isCurve: true,
      curveKind: "polyline",
      polylinePoints: [
        { x: 0.48, y: 0.14 },
        { x: 0.66, y: 0.22 },
        { x: 0.66, y: 0.40 },
        { x: 0.25, y: 0.50 },
        { x: 0.68, y: 0.58 },
        { x: 0.68, y: 0.78 },
        { x: 0.48, y: 0.86 },
      ],
    },
  ],
};

export default letterB;
