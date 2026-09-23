import type { LetterDefinition } from "../../types";

const letterO: LetterDefinition = {
  id: "O",
  displayLabel: "O",
  segments: [
    {
      start: { x: 0.5, y: 0.15 },
      end: { x: 0.506, y: 0.151 },
      isCurve: true,
      curveKind: "oval",
      ovalCenter: { x: 0.5, y: 0.5 },
      ovalRadiusX: 0.35,
      ovalRadiusY: 0.35,
      ovalStartAngleDeg: 90,
      ovalEndAngleDeg: 448,
      ovalCounterClockwise: true,
    },
  ],
};

export default letterO;
