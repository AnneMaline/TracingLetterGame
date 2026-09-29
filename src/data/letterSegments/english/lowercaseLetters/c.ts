import type { LetterDefinition } from "../../../../types";

const letterC: LetterDefinition = {
  id: "c",
  displayLabel: "c",
  segments: [
    {
      start: { x: 0.655, y: 0.56 },
      end: { x: 0.655, y: 0.78 },
      isCurve: true,
      curveKind: "oval",
      ovalCenter: { x: 0.52, y: 0.675 },
      ovalRadiusX: 0.175,
      ovalRadiusY: 0.175,
      ovalStartAngleDeg: 40,
      ovalEndAngleDeg: 320,
      ovalCounterClockwise: true,
    },
  ],
};

export default letterC;
