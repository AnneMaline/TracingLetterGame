import type { LetterDefinition } from "../../types";

const letterQ: LetterDefinition = {
  id: "Q",
  displayLabel: "Q",
  segments: [
    {
      start: { x: 0.5, y: 0.15 },
      end: { x: 0.506, y: 0.151 },
      isCurve: true,
      curveKind: "oval",
      ovalCenter: { x: 0.5, y: 0.5 },
      ovalRadiusX: 0.255,
      ovalRadiusY: 0.35,
      ovalStartAngleDeg: 90,
      ovalEndAngleDeg: 448,
      ovalCounterClockwise: true,
    },
    { start: { x: 0.6, y: 0.7 }, end: { x: 0.75, y: 0.85 } },
  ],
};

export default letterQ;
