import type { LetterDefinition } from "../../types";

const letterU: LetterDefinition = {
  id: "U",
  displayLabel: "U",
  segments: [
    {
      start: { x: 0.25, y: 0.15 },
      end: { x: 0.75, y: 0.15 },
      isCurve: true,
      curveKind: "polyline",
      polylinePoints: [
        { x: 0.25, y: 0.15 },
        { x: 0.25, y: 0.64 },
        {
          start: { x: 0.25, y: 0.64 },
          end: { x: 0.75, y: 0.64 },
          isCurve: true,
          ovalCenter: { x: 0.5, y: 0.64 },
          ovalRadiusX: 0.25,
          ovalRadiusY: 0.21,
          ovalStartAngleDeg: 180,
          ovalEndAngleDeg: 0,
          ovalCounterClockwise: true,
        },
        { x: 0.75, y: 0.64 },
        { x: 0.75, y: 0.15 },
      ],
    },
  ],
};

export default letterU;
