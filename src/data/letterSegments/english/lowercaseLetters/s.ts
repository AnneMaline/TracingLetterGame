import type { LetterDefinition } from "../../../../types";

const letterS: LetterDefinition = {
  id: "s",
  displayLabel: "s",
  segments: [
    {
      start: { x: 0.6, y: 0.535 },
      end: { x: 0.41, y: 0.785 },
      isCurve: true,
      curveKind: "polyline",
      polylinePoints: [
        {
          start: { x: 0.6, y: 0.535 },
          end: { x: 0.5, y: 0.68 },
          isCurve: true,
          ovalCenter: { x: 0.5, y: 0.59 },
          ovalRadiusX: 0.0975,
          ovalRadiusY: 0.0875,
          ovalStartAngleDeg: 30,
          ovalEndAngleDeg: 245,
          ovalCounterClockwise: true,
        },
        { x: 0.5, y: 0.68 },
        {
          start: { x: 0.525, y: 0.679 },
          end: { x: 0.41, y: 0.785 },
          isCurve: true,
          ovalCenter: { x: 0.5, y: 0.76 },
          ovalRadiusX: 0.0975,
          ovalRadiusY: 0.0875,
          ovalStartAngleDeg: 65,
          ovalEndAngleDeg: 200,
          ovalCounterClockwise: false,
        },
      ],
    },
  ],
};

export default letterS;
