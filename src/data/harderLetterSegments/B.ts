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
      curveKind: "bezier",
      bezierSegments: [
        {
          control1: { x: 0.66, y: 0.14 },
          control2: { x: 0.72, y: 0.46 },
          end: { x: 0.25, y: 0.50 },
        },
        {
          control1: { x: 0.72, y: 0.50 },
          control2: { x: 0.72, y: 0.86 },
          end: { x: 0.25, y: 0.86 },
        },
      ],
    },
  ],
};

export default letterB;
