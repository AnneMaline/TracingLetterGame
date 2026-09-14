import type { LetterDefinition } from "../../types";

const letterP: LetterDefinition = {
  id: "P",
  displayLabel: "P",
  segments: [
    { start: { x: 0.25, y: 0.14 }, end: { x: 0.25, y: 0.86 } },
    {
      start: { x: 0.25, y: 0.14 },
      end: { x: 0.25, y: 0.5 },
      isCurve: true,
      curveControlX: 0.65,
    },
  ],
};

export default letterP;
