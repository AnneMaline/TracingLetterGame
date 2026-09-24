import type { LetterDefinition } from "../../types";

const letterK: LetterDefinition = {
  id: "K",
  displayLabel: "K",
  segments: [
    { start: { x: 0.25, y: 0.15 }, end: { x: 0.25, y: 0.85 } },
    { start: { x: 0.65, y: 0.15 }, end: { x: 0.25, y: 0.5 } },
    { start: { x: 0.25, y: 0.5 }, end: { x: 0.65, y: 0.85 } },
  ],
};

export default letterK;
