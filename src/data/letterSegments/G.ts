import type { LetterDefinition } from "../../types";

const letterG: LetterDefinition = {
  id: "G",
  displayLabel: "G",
  segments: [
    {
      start: { x: 0.76, y: 0.29 },
      end: { x: 0.82, y: 0.51 },
      isCurve: true,
      curveKind: "oval",
      ovalCenter: { x: 0.5, y: 0.5 },
      ovalRadiusX: 0.32,
      ovalRadiusY: 0.35,
      ovalStartAngleDeg: 37,
      ovalEndAngleDeg: 357,
      ovalCounterClockwise: true,
    },
    { start: { x: 0.82, y: 0.51 }, end: { x: 0.55, y: 0.51 } },
  ],
};

export default letterG;
