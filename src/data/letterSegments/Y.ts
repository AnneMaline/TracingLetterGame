import type { LetterDefinition } from "../../types";

const letterY: LetterDefinition = {
  id: "Y",
  displayLabel: "Y",
  segments: [
    { start: { x: 0.25, y: 0.15 }, end: { x: 0.5, y: 0.5 } },
    { start: { x: 0.75, y: 0.15 }, end: { x: 0.5, y: 0.5 } },
    { start: { x: 0.5, y: 0.5 }, end: { x: 0.5, y: 0.85 } },
  ],
};

export default letterY;
