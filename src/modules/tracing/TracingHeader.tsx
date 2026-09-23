import React from "react";

interface Props {
  displayLabel?: string;
  onBackToMenu?: () => void;
  onNext?: () => void;
  showHelplines?: boolean;
  onToggleHelplines?: () => void;
}

export function TracingHeader({
  displayLabel,
  onBackToMenu,
  onNext,
  showHelplines = true,
  onToggleHelplines,
}: Props) {
  return (
    <header
      style={{
        width: "100%",
        maxWidth: "480px",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        padding: "0.25rem 0",
        gap: "0.5rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
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

        <div style={{ textAlign: "center", flex: 1 }}>
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
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={showHelplines}
        onClick={onToggleHelplines}
        data-testid="helplines-toggle"
        aria-label="Toggle helplines"
        style={toggleButtonStyle}
      >
        Helplines {showHelplines ? "On" : "Off"}
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

const toggleButtonStyle: React.CSSProperties = {
  minWidth: 120,
  minHeight: 48,
  padding: "0.5rem 0.75rem",
  fontSize: "0.95rem",
  fontWeight: 700,
  borderRadius: 12,
  border: "2px solid #17324d",
  background: "#e9f4ff",
  color: "#17324d",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
