import type { LetterDefinition } from "../../../../types";

const letterN: LetterDefinition = {
  id: "n",
  displayLabel: "n",
  segments: [
    { start: { x: 0.34, y: 0.5 }, end: { x: 0.34, y: 0.85 } },
    {
      start: { x: 0.34, y: 0.56 },
      end: { x: 0.63, y: 0.85 },
      isCurve: true,
      curveKind: "polyline",
      polylinePoints: [
        {
          start: { x: 0.34, y: 0.56 },
          end: { x: 0.63, y: 0.62 },
          isCurve: true,
          curveKind: "oval",
          ovalCenter: { x: 0.48, y: 0.63 },
          ovalRadiusX: 0.15,
          ovalRadiusY: 0.12,
          ovalStartAngleDeg: 160,
          ovalEndAngleDeg: 0,
          ovalCounterClockwise: false,
        },
        { x: 0.63, y: 0.85 },
      ],
    },
  ],
};

export default letterN;
