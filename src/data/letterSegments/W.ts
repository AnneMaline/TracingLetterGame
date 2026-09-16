import type { LetterDefinition } from "../../types";

const letterW: LetterDefinition = {
  id: "W",
  displayLabel: "W",
  segments: [
    {
      start: { x: 0.15, y: 0.14 },
      end: { x: 0.85, y: 0.14 },
      isCurve: true,
      curveKind: "polyline",
      polylinePoints: [
        { x: 0.3, y: 0.86 },
        { x: 0.5, y: 0.38 },
        { x: 0.7, y: 0.86 },
      ],
    },
  ],
};

export default letterW;
