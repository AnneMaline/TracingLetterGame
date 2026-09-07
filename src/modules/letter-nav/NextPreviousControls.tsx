interface Props {
  displayLabel: string;
  onPrevious: () => void;
  onNext: () => void;
}

export function NextPreviousControls({
  displayLabel,
  onPrevious,
  onNext,
}: Props) {
  return (
    <nav
      aria-label="Letter navigation"
      className="flex items-center justify-between gap-4 w-full max-w-[480px] mt-6"
    >
      <button
        type="button"
        onClick={onPrevious}
        data-testid="prev-letter"
        aria-label="Previous letter"
        style={buttonStyle}
      >
        ←
      </button>
      <div
        aria-live="polite"
        data-testid="current-letter-label"
        style={{
          fontSize: "2.5rem",
          fontWeight: 700,
          minWidth: "3rem",
          textAlign: "center",
        }}
      >
        {displayLabel}
      </div>
      <button
        type="button"
        onClick={onNext}
        data-testid="next-letter"
        aria-label="Next letter"
        style={buttonStyle}
      >
        →
      </button>
    </nav>
  );
}

const buttonStyle: React.CSSProperties = {
  minWidth: 64,
  minHeight: 64,
  fontSize: "1.75rem",
  borderRadius: 16,
  border: "2px solid #17324d",
  background: "#fffdf6",
  color: "#17324d",
  cursor: "pointer",
};
