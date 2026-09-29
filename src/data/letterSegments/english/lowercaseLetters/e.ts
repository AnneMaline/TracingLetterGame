import type { LetterDefinition } from "../../../../types";

const letterE: LetterDefinition = {
  id: "e",
  displayLabel: "e",
  segments: [
    { start: { x: 0.34, y: 0.66 }, end: { x: 0.675, y: 0.66 } },
    {
      start: { x: 0.675, y: 0.66 },
      end: { x: 0.65, y: 0.77 },
      isCurve: true,
      curveKind: "oval",
      ovalCenter: { x: 0.505, y: 0.675 },
      ovalRadiusX: 0.175,
      ovalRadiusY: 0.175,
      ovalStartAngleDeg: 5,
      ovalEndAngleDeg: 325,
      ovalCounterClockwise: true,
    },
  ],
};

export default letterE;
