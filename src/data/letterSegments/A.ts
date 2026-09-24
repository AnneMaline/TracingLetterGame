import type { LetterDefinition } from "../../types";

const letterA: LetterDefinition = {
  id: "A",
  displayLabel: "A",
  segments: [
    { start: { x: 0.5, y: 0.15 }, end: { x: 0.22, y: 0.85 } },
    { start: { x: 0.5, y: 0.15 }, end: { x: 0.78, y: 0.85 } },
    { start: { x: 0.36, y: 0.52 }, end: { x: 0.64, y: 0.52 } },
  ],
};

export default letterA;
