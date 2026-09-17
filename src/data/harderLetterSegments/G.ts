import type { LetterDefinition } from "../../types";

const letterG: LetterDefinition = {
  id: "G",
  displayLabel: "G",
  segments: [
    {
      start: { x: 0.7, y: 0.26 },
      end: { x: 0.55, y: 0.53 },
      isCurve: true,
      curveKind: "bezier",
      bezierSegments: [
        {
          control1: { x: 0.58, y: 0.14 },
          control2: { x: 0.30, y: 0.16 },
          end: { x: 0.24, y: 0.46 },
        },
        {
          control1: { x: 0.18, y: 0.74 },
          control2: { x: 0.48, y: 0.88 },
          end: { x: 0.68, y: 0.72 },
        },
        {
          control1: { x: 0.78, y: 0.64 },
          control2: { x: 0.78, y: 0.53 },
          end: { x: 0.55, y: 0.53 },
        },
      ],
    },
  ],
};

export default letterG;
