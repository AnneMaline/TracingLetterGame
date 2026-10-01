interface Props {
  checked: boolean;
  onToggle: () => void;
  label: string;
  testId: string;
}

export function ToggleSwitch({ checked, onToggle, label, testId }: Props) {
  return (
    <button
      type="button"
      data-testid={testId}
      role="switch"
      aria-checked={checked}
      onClick={onToggle}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        border: "none",
        borderRadius: "999px",
        padding: "0.4rem 0.9rem",
        background: checked ? "#17324d" : "#e2e8f0",
        color: checked ? "#ffffff" : "#334155",
        fontWeight: 700,
        fontSize: "0.9rem",
        cursor: "pointer",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: "inline-block",
          width: "2rem",
          height: "1.1rem",
          borderRadius: "999px",
          background: checked ? "#4ade80" : "#94a3b8",
          position: "relative",
          transition: "background 0.15s ease",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: "0.15rem",
            left: checked ? "1.05rem" : "0.15rem",
            width: "0.8rem",
            height: "0.8rem",
            borderRadius: "50%",
            background: "#ffffff",
            transition: "left 0.15s ease",
          }}
        />
      </span>
      {label}
    </button>
  );
}
