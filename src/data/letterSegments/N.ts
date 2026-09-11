import type { LetterDefinition } from "../../types";

const letterN: LetterDefinition = {
  id: "N",
  displayLabel: "N",
  segments: [
    { start: { x: 0.25, y: 0.14 }, end: { x: 0.25, y: 0.86 } },
    { start: { x: 0.25, y: 0.14 }, end: { x: 0.75, y: 0.86 } },
    { start: { x: 0.75, y: 0.86 }, end: { x: 0.75, y: 0.14 } },
  ],
};

export default letterN;
