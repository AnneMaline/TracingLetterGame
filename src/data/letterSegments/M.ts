import type { LetterDefinition } from "../../types";

const letterM: LetterDefinition = {
  id: "M",
  displayLabel: "M",
  segments: [
    { start: { x: 0.2, y: 0.15 }, end: { x: 0.2, y: 0.85 } },
    { start: { x: 0.8, y: 0.15 }, end: { x: 0.8, y: 0.85 } },
    { start: { x: 0.2, y: 0.15 }, end: { x: 0.5, y: 0.85 } },
    { start: { x: 0.8, y: 0.15 }, end: { x: 0.5, y: 0.85 } },
  ],
};

export default letterM;
