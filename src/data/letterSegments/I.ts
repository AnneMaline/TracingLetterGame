import type { LetterDefinition } from "../../types";

const letterI: LetterDefinition = {
  id: "I",
  displayLabel: "I",
  segments: [
    { start: { x: 0.5, y: 0.15 }, end: { x: 0.5, y: 0.85 } },
    { start: { x: 0.45, y: 0.15 }, end: { x: 0.55, y: 0.15 } },
    { start: { x: 0.45, y: 0.85 }, end: { x: 0.55, y: 0.85 } },
  ],
};

export default letterI;
