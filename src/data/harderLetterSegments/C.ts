import type { LetterDefinition } from "../../types";

const letterC: LetterDefinition = {
  id: "C",
  displayLabel: "C",
  segments: [
    {
      start: { x: 0.66, y: 0.22 },
      end: { x: 0.66, y: 0.78 },
      isCurve: true,
      curveKind: "oval",
      ovalCenter: { x: 0.5, y: 0.5 },
      ovalRadiusX: 0.26,
      ovalRadiusY: 0.35,
      ovalStartAngleDeg: 53,
      ovalEndAngleDeg: 307,
      ovalCounterClockwise: true,
    },
  ],
};

export default letterC;
