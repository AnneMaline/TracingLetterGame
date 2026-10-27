import { useEffect } from "react";
import roundCompleteImage from "../../assets/round-complete.svg";
import { ROUND_COMPLETE_DISPLAY_MS } from "../../shared/constants";

interface Props {
  onComplete: () => void;
}

export function RoundCompleteScreen({ onComplete }: Props) {
  useEffect(() => {
    const timer = setTimeout(onComplete, ROUND_COMPLETE_DISPLAY_MS);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <main
      data-testid="round-complete-screen"
      role="status"
      aria-live="polite"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.5rem",
        padding: "2rem",
        background: "#fffdf6",
        color: "#17324d",
        textAlign: "center",
      }}
    >
      <img
        src={roundCompleteImage}
        alt=""
        data-testid="round-complete-image"
        style={{ width: "min(56vw, 260px)", height: "auto" }}
      />
      <h1 style={{ margin: 0, fontSize: "2.5rem", fontWeight: 800 }}>
        You did it!
      </h1>
    </main>
  );
}
