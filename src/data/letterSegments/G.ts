import type { LetterDefinition } from "../../types";

const letterG: LetterDefinition = {
  id: "G",
  displayLabel: "G",
  segments: [
    {
      start: { x: 0.7, y: 0.26 },
      end: { x: 0.76, y: 0.53 },
      isCurve: true,
      curveKind: "oval",
      ovalCenter: { x: 0.5, y: 0.5 },
      ovalRadiusX: 0.26,
      ovalRadiusY: 0.34,
      ovalStartAngleDeg: 45,
      ovalEndAngleDeg: 355,
      ovalCounterClockwise: true,
    },
    { start: { x: 0.76, y: 0.53 }, end: { x: 0.55, y: 0.53 } },
  ],
};

export default letterG;
