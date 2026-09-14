import type { LetterDefinition } from "../../types";

const letterR: LetterDefinition = {
  id: "R",
  displayLabel: "R",
  segments: [
    { start: { x: 0.25, y: 0.14 }, end: { x: 0.25, y: 0.86 } },
    {
      start: { x: 0.25, y: 0.14 },
      end: { x: 0.25, y: 0.5 },
      isCurve: true,
      curveControlX: 0.72,
    },
    { start: { x: 0.25, y: 0.5 }, end: { x: 0.6, y: 0.86 } },
  ],
};

export default letterR;
