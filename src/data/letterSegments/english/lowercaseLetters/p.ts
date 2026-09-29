import type { LetterDefinition } from "../../../../types";

const letterP: LetterDefinition = {
  id: "p",
  displayLabel: "p",
  segments: [
    { start: { x: 0.34, y: 0.5 }, end: { x: 0.34, y: 1.21 } },
    {
      start: { x: 0.34, y: 0.6 },
      end: { x: 0.34, y: 0.73 },
      isCurve: true,
      curveKind: "oval",
      ovalCenter: { x: 0.505, y: 0.675 },
      ovalRadiusX: 0.175,
      ovalRadiusY: 0.175,
      ovalStartAngleDeg: 160,
      ovalEndAngleDeg: 200,
      ovalCounterClockwise: false,
    },
  ],
};

export default letterP;
