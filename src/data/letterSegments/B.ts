import type { LetterDefinition } from "../../types";

const letterB: LetterDefinition = {
  id: "B",
  displayLabel: "B",
  segments: [
    { start: { x: 0.25, y: 0.15 }, end: { x: 0.25, y: 0.85 } },
    {
      start: { x: 0.25, y: 0.15 },
      end: { x: 0.25, y: 0.5 },
      isCurve: true,
      curveControlX: 0.62,
    },
    {
      start: { x: 0.25, y: 0.5 },
      end: { x: 0.25, y: 0.85 },
      isCurve: true,
      curveControlX: 0.65,
    },
  ],
};

export default letterB;
