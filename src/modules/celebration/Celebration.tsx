import { useEffect } from "react";
import { CELEBRATION_DURATION_MS } from "../../shared/constants";

interface Props {
  visible: boolean;
  onComplete: () => void;
}

export function Celebration({ visible, onComplete }: Props) {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onComplete, CELEBRATION_DURATION_MS);
    return () => clearTimeout(timer);
  }, [visible, onComplete]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="celebration"
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        placeItems: "center",
        pointerEvents: "none",
        animation: "celebrate-fade 1.5s ease-out forwards",
      }}
    >
      <div
        style={{
          fontSize: "6rem",
          animation: "celebrate-pop 0.6s ease-out both",
        }}
      >
        ⭐
      </div>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          fontSize: "8rem",
          animation: "celebrate-spin 1.5s linear",
          opacity: 0.35,
        }}
      >
        ✨
      </div>
    </div>
  );
}
