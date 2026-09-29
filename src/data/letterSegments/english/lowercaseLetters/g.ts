import type { LetterDefinition } from "../../../../types";

const letterG: LetterDefinition = {
  id: "g",
  displayLabel: "g",
  segments: [
    {
      start: { x: 0.66, y: 0.6 },
      end: { x: 0.66, y: 0.73 },
      isCurve: true,
      curveKind: "oval",
      ovalCenter: { x: 0.495, y: 0.675 },
      ovalRadiusX: 0.175,
      ovalRadiusY: 0.175,
      ovalStartAngleDeg: 20,
      ovalEndAngleDeg: 340,
      ovalCounterClockwise: true,
    },
    {
      start: { x: 0.66, y: 0.5 },
      end: { x: 0.32, y: 1.08 },
      isCurve: true,
      curveKind: "polyline",
      polylinePoints: [
        {
          start: { x: 0.66, y: 0.86 },
          end: { x: 0.32, y: 1.08 },
          isCurve: true,
          curveKind: "oval",
          ovalCenter: { x: 0.485, y: 1.03 },
          ovalRadiusX: 0.175,
          ovalRadiusY: 0.175,
          ovalStartAngleDeg: 0,
          ovalEndAngleDeg: 200,
          ovalCounterClockwise: false,
        },
      ],
    },
  ],
};

export default letterG;
