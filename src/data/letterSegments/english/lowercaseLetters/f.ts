import type { LetterDefinition } from "../../../../types";

const letterF: LetterDefinition = {
  id: "f",
  displayLabel: "f",
  segments: [
    {
      start: { x: 0.68, y: 0.22 },
      end: { x: 0.44, y: 0.85 },
      isCurve: true,
      curveKind: "polyline",
      polylinePoints: [
        {
          start: { x: 0.68, y: 0.22 },
          end: { x: 0.44, y: 0.3 },
          isCurve: true,
          curveKind: "oval",
          ovalCenter: { x: 0.56, y: 0.25 },
          ovalRadiusX: 0.12,
          ovalRadiusY: 0.1,
          ovalStartAngleDeg: 20,
          ovalEndAngleDeg: 180,
          ovalCounterClockwise: true,
        },
      ],
    },
    { start: { x: 0.35, y: 0.5 }, end: { x: 0.54, y: 0.5 } },
  ],
};

export default letterF;
