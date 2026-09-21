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
      ovalRadiusX: 0.255,
      ovalRadiusY: 0.35,
      ovalStartAngleDeg: 90,
      ovalEndAngleDeg: -268,
      ovalCounterClockwise: false,
    },
  ],
};

export default letterO;
