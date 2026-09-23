import type { LetterDefinition } from "../../types";

const letterE: LetterDefinition = {
  id: "E",
  displayLabel: "E",
  segments: [
    { start: { x: 0.25, y: 0.15 }, end: { x: 0.25, y: 0.85 } },
    { start: { x: 0.25, y: 0.15 }, end: { x: 0.75, y: 0.15 } },
    { start: { x: 0.25, y: 0.5 }, end: { x: 0.65, y: 0.5 } },
    { start: { x: 0.25, y: 0.85 }, end: { x: 0.75, y: 0.85 } },
  ],
};

export default letterE;
