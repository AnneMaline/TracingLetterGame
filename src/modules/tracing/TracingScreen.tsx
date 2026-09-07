import { useCallback, useState } from "react";
import type { LetterDefinition } from "../../types";
import { NextPreviousControls } from "../letter-nav/NextPreviousControls";
import { LetterTracer } from "./LetterTracer";

interface Props {
  letters: LetterDefinition[];
}

export function TracingScreen({ letters }: Props) {
  const [letterIndex, setLetterIndex] = useState(0);
  const total = letters.length;
  const letter = letters[letterIndex];

  const goPrevious = useCallback(() => {
    setLetterIndex((i) => (i - 1 + total) % total);
  }, [total]);

  const goNext = useCallback(() => {
    setLetterIndex((i) => (i + 1) % total);
  }, [total]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "1.5rem 1rem",
        gap: "1rem",
      }}
      data-testid="tracing-screen"
    >
      <h1
        style={{
          fontSize: "1.25rem",
          fontWeight: 600,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          color: "#7a8ba0",
          margin: 0,
        }}
      >
        TraceQuest
      </h1>
      <LetterTracer key={letter.id} letter={letter} />
      <NextPreviousControls
        displayLabel={letter.displayLabel}
        onPrevious={goPrevious}
        onNext={goNext}
      />
    </main>
  );
}
