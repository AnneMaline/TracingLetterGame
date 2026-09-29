import type { LetterDefinition } from "../../../../types";

const letterR: LetterDefinition = {
  id: "r",
  displayLabel: "r",
  segments: [
    { start: { x: 0.34, y: 0.5 }, end: { x: 0.34, y: 0.85 } },
    {
      start: { x: 0.34, y: 0.56 },
      end: { x: 0.56, y: 0.55 },
      isCurve: true,
      curveKind: "oval",
      ovalCenter: { x: 0.46, y: 0.66 },
      ovalRadiusX: 0.15,
      ovalRadiusY: 0.15,
      ovalStartAngleDeg: 140,
      ovalEndAngleDeg: 50,
      ovalCounterClockwise: false,
    },
  ],
};

export default letterR;
