import type { LetterDefinition } from "../../../../types";

const letterM: LetterDefinition = {
  id: "m",
  displayLabel: "m",
  segments: [
    { start: { x: 0.28, y: 0.5 }, end: { x: 0.28, y: 0.85 } },
    {
      start: { x: 0.28, y: 0.56 },
      end: { x: 0.48, y: 0.85 },
      isCurve: true,
      curveKind: "polyline",
      polylinePoints: [
        {
          start: { x: 0.28, y: 0.56 },
          end: { x: 0.48, y: 0.6 },
          isCurve: true,
          curveKind: "oval",
          ovalCenter: { x: 0.38, y: 0.6 },
          ovalRadiusX: 0.1,
          ovalRadiusY: 0.1,
          ovalStartAngleDeg: 180,
          ovalEndAngleDeg: 0,
          ovalCounterClockwise: false,
        },
        { x: 0.48, y: 0.85 },
      ],
    },
    {
      start: { x: 0.48, y: 0.56 },
      end: { x: 0.68, y: 0.85 },
      isCurve: true,
      curveKind: "polyline",
      polylinePoints: [
        {
          start: { x: 0.48, y: 0.56 },
          end: { x: 0.68, y: 0.6 },
          isCurve: true,
          curveKind: "oval",
          ovalCenter: { x: 0.58, y: 0.6 },
          ovalRadiusX: 0.1,
          ovalRadiusY: 0.1,
          ovalStartAngleDeg: 180,
          ovalEndAngleDeg: 0,
          ovalCounterClockwise: false,
        },
        { x: 0.68, y: 0.85 },
      ],
    },
  ],
};

export default letterM;
