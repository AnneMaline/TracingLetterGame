import type { LetterDefinition } from "../../types";

const letterG: LetterDefinition = {
  id: "G",
  displayLabel: "G",
  segments: [
    {
      start: { x: 0.7, y: 0.26 },
      end: { x: 0.55, y: 0.53 },
      isCurve: true,
      curveKind: "spline",
      splinePoints: [
        { x: 0.56, y: 0.15 },
        { x: 0.34, y: 0.18 },
        { x: 0.23, y: 0.38 },
        { x: 0.25, y: 0.64 },
        { x: 0.40, y: 0.83 },
        { x: 0.63, y: 0.80 },
        { x: 0.76, y: 0.62 },
        { x: 0.76, y: 0.53 },
      ],
    },
  ],
};

export default letterG;
