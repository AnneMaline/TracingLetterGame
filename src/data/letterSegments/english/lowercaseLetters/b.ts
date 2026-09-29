import type { LetterDefinition } from "../../../../types";

const letterB: LetterDefinition = {
  id: "b",
  displayLabel: "b",
  segments: [
    { start: { x: 0.34, y: 0.15 }, end: { x: 0.34, y: 0.85 } },
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

export default letterB;
