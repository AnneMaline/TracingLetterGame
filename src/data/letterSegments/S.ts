import type { LetterDefinition } from "../../types";

const letterS: LetterDefinition = {
  id: "S",
  displayLabel: "S",
  segments: [
    {
      start: { x: 0.65, y: 0.2 },
      end: { x: 0.33, y: 0.76 },
      isCurve: true,
      curveKind: "polyline",
      polylinePoints: [
        {
          start: { x: 0.65, y: 0.2 },
          end: { x: 0.409, y: 0.476 },
          isCurve: true,
          ovalCenter: { x: 0.5, y: 0.32 },
          ovalRadiusX: 0.195,
          ovalRadiusY: 0.175,
          ovalStartAngleDeg: 40,
          ovalEndAngleDeg: 245,
          ovalCounterClockwise: true,
        },
        { x: 0.5, y: 0.5 },
        {
          start: { x: 0.591, y: 0.524 },
          end: { x: 0.33, y: 0.76 },
          isCurve: true,
          ovalCenter: { x: 0.5, y: 0.68 },
          ovalRadiusX: 0.195,
          ovalRadiusY: 0.175,
          ovalStartAngleDeg: 65,
          ovalEndAngleDeg: 210,
          ovalCounterClockwise: false,
        },
      ],
    },
  ],
};

export default letterS;
