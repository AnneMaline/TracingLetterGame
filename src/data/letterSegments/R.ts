import type { LetterDefinition } from "../../types";

const letterR: LetterDefinition = {
  id: "R",
  displayLabel: "R",
  segments: [
    { start: { x: 0.25, y: 0.15 }, end: { x: 0.25, y: 0.85 } },
    {
      start: { x: 0.25, y: 0.15 },
      end: { x: 0.25, y: 0.5 },
      isCurve: true,
      curveControlX: 0.65,
    },
    { start: { x: 0.35, y: 0.5 }, end: { x: 0.6, y: 0.85 } },
  ],
};

export default letterR;
