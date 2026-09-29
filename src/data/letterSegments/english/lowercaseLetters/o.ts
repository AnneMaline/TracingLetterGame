import type { LetterDefinition } from "../../../../types";

const letterO: LetterDefinition = {
  id: "o",
  displayLabel: "o",
  segments: [
    {
      start: { x: 0.5, y: 0.5 },
      end: { x: 0.51, y: 0.5 },
      isCurve: true,
      curveKind: "oval",
      ovalCenter: { x: 0.495, y: 0.675 },
      ovalRadiusX: 0.175,
      ovalRadiusY: 0.175,
      ovalStartAngleDeg: 90,
      ovalEndAngleDeg: 90,
      ovalCounterClockwise: true,
    },
  ],
};

export default letterO;
