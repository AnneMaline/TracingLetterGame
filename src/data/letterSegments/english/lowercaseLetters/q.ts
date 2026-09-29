import type { LetterDefinition } from "../../../../types";

const letterQ: LetterDefinition = {
  id: "q",
  displayLabel: "q",
  segments: [
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
    {
      start: { x: 0.67, y: 0.5 },
      end: { x: 0.72, y: 1.19 },
      curveKind: "polyline",
      polylinePoints: [
        { x: 0.67, y: 1.21 },
        { x: 0.72, y: 1.19 },
      ],
    },
  ],
};

export default letterQ;
