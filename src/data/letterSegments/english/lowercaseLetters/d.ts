import type { LetterDefinition } from "../../../../types";

const letterD: LetterDefinition = {
  id: "d",
  displayLabel: "d",
  segments: [
    { start: { x: 0.67, y: 0.15 }, end: { x: 0.67, y: 0.85 } },
    {
      start: { x: 0.67, y: 0.6 },
      end: { x: 0.67, y: 0.73 },
      isCurve: true,
      curveKind: "oval",
      ovalCenter: { x: 0.505, y: 0.675 },
      ovalRadiusX: 0.175,
      ovalRadiusY: 0.175,
      ovalStartAngleDeg: 20,
      ovalEndAngleDeg: 340,
      ovalCounterClockwise: true,
    },
  ],
};

export default letterD;
