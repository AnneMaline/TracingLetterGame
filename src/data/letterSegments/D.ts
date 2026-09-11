import type { LetterDefinition } from "../../types";

const letterD: LetterDefinition = {
  id: "D",
  displayLabel: "D",
  segments: [
    { start: { x: 0.25, y: 0.14 }, end: { x: 0.25, y: 0.86 } },
    {
      start: { x: 0.25, y: 0.14 },
      end: { x: 0.25, y: 0.86 },
      isCurve: true,
      curveControlX: 0.75,
    },
  ],
};

export default letterD;
