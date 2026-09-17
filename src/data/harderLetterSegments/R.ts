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
      curveKind: "bezier",
      bezierSegments: [
        {
          control1: { x: 0.62, y: 0.14 },
          control2: { x: 0.68, y: 0.50 },
          end: { x: 0.25, y: 0.50 },
        },
        {
          control1: { x: 0.36, y: 0.57 },
          control2: { x: 0.50, y: 0.72 },
          end: { x: 0.60, y: 0.86 },
        },
      ],
    },
  ],
};

export default letterR;
