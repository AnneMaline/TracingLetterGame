import { HELPLINE_X_INSET, HELPLINE_Y_POSITIONS } from "../../shared/constants";

interface Props {
  isLowercase: boolean;
}

const [TOP_Y, MIDDLE_Y, BOTTOM_Y] = HELPLINE_Y_POSITIONS;
// Lowercase canvases get one extra line below the baseline at the same spacing, for descenders.
const DESCENDER_Y = BOTTOM_Y + (MIDDLE_Y - TOP_Y);
const X1 = HELPLINE_X_INSET;
const X2 = 1 - HELPLINE_X_INSET;
const DASH = "0.02 0.02";

const LINES = [
  { y: TOP_Y, testId: "helpline-top", dashed: false },
  { y: MIDDLE_Y, testId: "helpline-middle", dashed: true },
  { y: BOTTOM_Y, testId: "helpline-bottom", dashed: false },
] as const;

export function Helplines({ isLowercase }: Props) {
  return (
    <g
      stroke="#8ea3bd"
      strokeWidth={0.008}
      opacity={0.65}
      pointerEvents="none"
      data-testid="helplines"
    >
      {LINES.map(({ y, testId, dashed }) => (
        <line
          key={testId}
          x1={X1}
          y1={y}
          x2={X2}
          y2={y}
          strokeDasharray={dashed ? DASH : undefined}
          data-testid={testId}
        />
      ))}
      {isLowercase && (
        <line
          x1={X1}
          y1={DESCENDER_Y}
          x2={X2}
          y2={DESCENDER_Y}
          strokeDasharray={DASH}
          data-testid="helpline-lowercase-descender"
        />
      )}
    </g>
  );
}
