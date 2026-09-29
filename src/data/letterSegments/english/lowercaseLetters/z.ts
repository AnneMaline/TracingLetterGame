import type { LetterDefinition } from "../../../../types";

const letterZ: LetterDefinition = {
  id: "z",
  displayLabel: "z",
  segments: [
    { start: { x: 0.35, y: 0.5 }, end: { x: 0.65, y: 0.5 } },
    { start: { x: 0.65, y: 0.5 }, end: { x: 0.35, y: 0.85 } },
    { start: { x: 0.35, y: 0.85 }, end: { x: 0.65, y: 0.85 } },
  ],
};

export default letterZ;
