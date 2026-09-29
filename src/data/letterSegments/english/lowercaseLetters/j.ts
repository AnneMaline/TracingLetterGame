import type { LetterDefinition } from "../../../../types";

const letterJ: LetterDefinition = {
  id: "j",
  displayLabel: "j",
  segments: [
    {
      start: { x: 0.6, y: 0.5 },
      end: { x: 0.37, y: 1.12 },
      isCurve: true,
      curveKind: "polyline",
      polylinePoints: [
        { x: 0.6, y: 0.5 },
        {
          start: { x: 0.6, y: 0.86 },
          end: { x: 0.37, y: 1.12 },
          isCurve: true,
          curveKind: "oval",
          ovalCenter: { x: 0.485, y: 1.09 },
          ovalRadiusX: 0.12,
          ovalRadiusY: 0.12,
          ovalStartAngleDeg: 0,
          ovalEndAngleDeg: 200,
          ovalCounterClockwise: false,
        },
      ],
    },

    {
      start: { x: 0.6, y: 0.34 },
      end: { x: 0.6, y: 0.34 },
      isCurve: true,
      curveKind: "oval",
      ovalCenter: { x: 0.6, y: 0.34 },
      ovalRadiusX: 0.01,
      ovalRadiusY: 0.01,
      ovalStartAngleDeg: 0,
      ovalEndAngleDeg: 360,
      ovalCounterClockwise: true,
    },
  ],
};

export default letterJ;
