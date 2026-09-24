import type { LetterDefinition } from "../../types";

const letterD: LetterDefinition = {
  id: "D",
  displayLabel: "D",
  segments: [
    { start: { x: 0.25, y: 0.15 }, end: { x: 0.25, y: 0.85 } },
    {
      start: { x: 0.25, y: 0.15 },
      end: { x: 0.25, y: 0.85 },
      isCurve: true,
      curveControlX: 0.75,
    },
  ],
};

export default letterD;
