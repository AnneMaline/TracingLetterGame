import type { LetterDefinition } from "../../types";

const letterM: LetterDefinition = {
  id: "M",
  displayLabel: "M",
  segments: [
    { start: { x: 0.2, y: 0.14 }, end: { x: 0.2, y: 0.86 } },
    { start: { x: 0.2, y: 0.14 }, end: { x: 0.5, y: 0.55 } },
    { start: { x: 0.5, y: 0.55 }, end: { x: 0.8, y: 0.14 } },
    { start: { x: 0.8, y: 0.14 }, end: { x: 0.8, y: 0.86 } },
  ],
};

export default letterM;
