import type { LetterDefinition } from "../../types";

const letterJ: LetterDefinition = {
  id: "J",
  displayLabel: "J",
  segments: [
    {
      start: { x: 0.62, y: 0.15 },
      end: { x: 0.25, y: 0.675 },
      isCurve: true,
      curveKind: "polyline",
      polylinePoints: [
        { x: 0.62, y: 0.26 },
        { x: 0.62, y: 0.38 },
        { x: 0.62, y: 0.5 },
        { x: 0.62, y: 0.62 },
        {
          start: { x: 0.62, y: 0.675 },
          end: { x: 0.25, y: 0.675 },
          ovalCenter: { x: 0.435, y: 0.675 },
          ovalRadiusX: 0.185,
          ovalRadiusY: 0.175,
          ovalStartAngleDeg: 0,
          ovalEndAngleDeg: 180,
          ovalCounterClockwise: false,
          isCurve: true,
        },
      ],
    },
  ],
};

export default letterJ;
