import type { LetterDefinition } from "../../types";

const letterZ: LetterDefinition = {
  id: "Z",
  displayLabel: "Z",
  segments: [
    {
      start: { x: 0.2, y: 0.14 },
      end: { x: 0.75, y: 0.86 },
      isCurve: true,
      curveKind: "polyline",
      polylinePoints: [
        { x: 0.75, y: 0.14 },
        { x: 0.2, y: 0.86 },
      ],
    },
  ],
};

export default letterZ;
