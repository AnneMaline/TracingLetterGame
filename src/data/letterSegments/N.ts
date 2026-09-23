import type { LetterDefinition } from "../../types";

const letterN: LetterDefinition = {
  id: "N",
  displayLabel: "N",
  segments: [
    { start: { x: 0.25, y: 0.15 }, end: { x: 0.25, y: 0.85 } },
    { start: { x: 0.75, y: 0.15 }, end: { x: 0.75, y: 0.85 } },
    { start: { x: 0.25, y: 0.15 }, end: { x: 0.75, y: 0.85 } },
  ],
};

export default letterN;
