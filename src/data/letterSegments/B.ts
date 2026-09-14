import type { LetterDefinition } from "../../types";

const letterB: LetterDefinition = {
  id: "B",
  displayLabel: "B",
  segments: [
    { start: { x: 0.25, y: 0.14 }, end: { x: 0.25, y: 0.86 } },
    {
      start: { x: 0.25, y: 0.14 },
      end: { x: 0.25, y: 0.5 },
      isCurve: true,
      curveControlX: 0.72,
    },
    {
      start: { x: 0.25, y: 0.5 },
      end: { x: 0.25, y: 0.86 },
      isCurve: true,
      curveControlX: 0.72,
    },
  ],
};

export default letterB;
