import React from "react";

interface Props {
  displayLabel?: string;
  onBackToMenu?: () => void;
  onNext?: () => void;
}

export function TracingHeader({ displayLabel, onBackToMenu, onNext }: Props) {
  return (
    <header
      style={{
        width: "100%",
        maxWidth: "480px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.25rem 0",
      }}
    >
      <button
        type="button"
        onClick={onBackToMenu}
        data-testid="menu-button"
        aria-label="Back to menu"
        style={navButtonStyle}
      >
        ← Menu
      </button>

      <div style={{ textAlign: "center" }}>
        <h1
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: "#17324d",
            margin: 0,
          }}
        >
          TraceQuest
        </h1>
        {displayLabel && (
          <div
            data-testid="current-letter-indicator"
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "#7a8ba0",
            }}
          >
            Letter {displayLabel}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onNext}
        data-testid="next-letter"
        aria-label="Next letter"
        style={navButtonStyle}
      >
        Next →
      </button>
    </header>
  );
}

const navButtonStyle: React.CSSProperties = {
  minWidth: 80,
  minHeight: 48,
  padding: "0.5rem 1rem",
  fontSize: "1rem",
  fontWeight: 700,
  borderRadius: 12,
  border: "2px solid #17324d",
  background: "#fffdf6",
  color: "#17324d",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
