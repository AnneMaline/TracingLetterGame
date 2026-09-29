import type { LetterDefinition } from "../../../../types";

const letterA: LetterDefinition = {
  id: "a",
  displayLabel: "a",
  segments: [
    {
      start: { x: 0.66, y: 0.6 },
      end: { x: 0.66, y: 0.73 },
      isCurve: true,
      curveKind: "oval",
      ovalCenter: { x: 0.495, y: 0.675 },
      ovalRadiusX: 0.175,
      ovalRadiusY: 0.175,
      ovalStartAngleDeg: 20,
      ovalEndAngleDeg: 340,
      ovalCounterClockwise: true,
    },
    { start: { x: 0.66, y: 0.49 }, end: { x: 0.66, y: 0.85 } },
  ],
};

export default letterA;
