import type { LetterDefinition } from "../../types";

const letterJ: LetterDefinition = {
  id: "J",
  displayLabel: "J",
  segments: [
    {
      start: { x: 0.62, y: 0.14 },
      end: { x: 0.3, y: 0.65 },
      isCurve: true,
      curveKind: "polyline",
      polylinePoints: [
        { x: 0.62, y: 0.26 },
        { x: 0.62, y: 0.38 },
        { x: 0.62, y: 0.5 },
        { x: 0.62, y: 0.62 },
        { x: 0.61, y: 0.68 },
        { x: 0.59, y: 0.73 },
        { x: 0.55, y: 0.77 },
        { x: 0.5, y: 0.8 },
        { x: 0.45, y: 0.81 },
        { x: 0.4, y: 0.8 },
        { x: 0.35, y: 0.77 },
        { x: 0.32, y: 0.73 },
      ],
    },
    { start: { x: 0.5, y: 0.14 }, end: { x: 0.75, y: 0.14 } },
  ],
};

export default letterJ;
