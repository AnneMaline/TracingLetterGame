import type { LetterDefinition } from "../../types";

const letterM: LetterDefinition = {
  id: "M",
  displayLabel: "M",
  segments: [
    { start: { x: 0.2, y: 0.14 }, end: { x: 0.2, y: 0.86 } },
    {
      start: { x: 0.2, y: 0.14 },
      end: { x: 0.8, y: 0.86 },
      isCurve: true,
      curveKind: "polyline",
      polylinePoints: [
        { x: 0.5, y: 0.55 },
        { x: 0.8, y: 0.14 },
      ],
    },
  ],
};

export default letterM;
