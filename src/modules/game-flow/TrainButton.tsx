import type { CSSProperties } from "react";

interface Props {
  onClick?: () => void;
}

export function TrainButton({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="train-button"
      aria-label="Train"
      style={buttonStyle}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 32 32"
        width="28"
        height="28"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M7 25 9 19 22 6a3 3 0 0 1 4 4L13 23l-6 2Z" />
        <path d="m19 9 4 4M6 28h20" />
        <circle cx="10" cy="28" r="1" fill="currentColor" />
        <circle cx="16" cy="28" r="1" fill="currentColor" />
        <circle cx="22" cy="28" r="1" fill="currentColor" />
      </svg>
    </button>
  );
}

const buttonStyle: CSSProperties = {
  width: 48,
  height: 48,
  flex: "0 0 48px",
  padding: 8,
  border: "2px solid #17324d",
  borderRadius: 12,
  background: "#fffdf6",
  color: "#17324d",
  cursor: "pointer",
  display: "grid",
  placeItems: "center",
};
