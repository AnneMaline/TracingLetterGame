import type { LetterDefinition } from "../../types";

const letterE: LetterDefinition = {
  id: "E",
  displayLabel: "E",
  segments: [
    { start: { x: 0.25, y: 0.14 }, end: { x: 0.25, y: 0.86 } },
    { start: { x: 0.25, y: 0.14 }, end: { x: 0.75, y: 0.14 } },
    { start: { x: 0.25, y: 0.5 }, end: { x: 0.65, y: 0.5 } },
    { start: { x: 0.25, y: 0.86 }, end: { x: 0.75, y: 0.86 } },
  ],
};

export default letterE;
