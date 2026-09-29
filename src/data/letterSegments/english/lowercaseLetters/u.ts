import type { LetterDefinition } from "../../../../types";

const letterU: LetterDefinition = {
  id: "u",
  displayLabel: "u",
  segments: [
    {
      start: { x: 0.367, y: 0.5 },
      end: { x: 0.66, y: 0.72 },
      isCurve: true,
      curveKind: "polyline",
      polylinePoints: [
        {
          start: { x: 0.367, y: 0.56 },
          end: { x: 0.66, y: 0.72 },
          isCurve: true,
          curveKind: "oval",
          ovalCenter: { x: 0.52, y: 0.73 },
          ovalRadiusX: 0.15,
          ovalRadiusY: 0.12,
          ovalStartAngleDeg: 180,
          ovalEndAngleDeg: 340,
          ovalCounterClockwise: true,
        },
      ],
    },
    { start: { x: 0.665, y: 0.5 }, end: { x: 0.665, y: 0.85 } },
  ],
};

export default letterU;
