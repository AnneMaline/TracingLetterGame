import type { LetterDefinition } from "../../../../types";

const letterI: LetterDefinition = {
  id: "i",
  displayLabel: "i",
  segments: [
    { start: { x: 0.5, y: 0.5 }, end: { x: 0.5, y: 0.86 } },
    {
      start: { x: 0.5, y: 0.34 },
      end: { x: 0.501, y: 0.341 },
      isCurve: true,
      curveKind: "oval",
      ovalCenter: { x: 0.5, y: 0.38 },
      ovalRadiusX: 0.01,
      ovalRadiusY: 0.01,
      ovalStartAngleDeg: 0,
      ovalEndAngleDeg: 360,
      ovalCounterClockwise: true,
    },
  ],
};

export default letterI;
