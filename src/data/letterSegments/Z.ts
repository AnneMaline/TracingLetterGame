import type { LetterDefinition } from "../../types";

const letterZ: LetterDefinition = {
  id: "Z",
  displayLabel: "Z",
  segments: [
    { start: { x: 0.25, y: 0.15 }, end: { x: 0.75, y: 0.15 } },
    { start: { x: 0.75, y: 0.15 }, end: { x: 0.25, y: 0.85 } },
    { start: { x: 0.25, y: 0.85 }, end: { x: 0.75, y: 0.85 } },
  ],
};

export default letterZ;
