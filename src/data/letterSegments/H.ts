import type { LetterDefinition } from "../../types";

const letterH: LetterDefinition = {
  id: "H",
  displayLabel: "H",
  segments: [
    { start: { x: 0.25, y: 0.15 }, end: { x: 0.25, y: 0.85 } },
    { start: { x: 0.75, y: 0.15 }, end: { x: 0.75, y: 0.85 } },
    { start: { x: 0.25, y: 0.5 }, end: { x: 0.75, y: 0.5 } },
  ],
};

export default letterH;
