import { useCallback, useState } from "react";
import type { LetterDefinition } from "../../types";
import { LetterTracer } from "./LetterTracer";
import { TracingHeader } from "./TracingHeader";

interface Props {
  letters: LetterDefinition[];
  initialLetterIndex?: number;
  onBackToMenu?: () => void;
  showShadow?: boolean;
  isHardMode?: boolean;
}

export function TracingScreen({
  letters,
  initialLetterIndex = 0,
  onBackToMenu,
  showShadow = true,
  isHardMode = false,
}: Props) {
  const [letterIndex, setLetterIndex] = useState(initialLetterIndex);
  const total = letters.length;
  const letter = letters[letterIndex];

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
        padding: "1rem",
        gap: "1rem",
      }}
      data-testid="tracing-screen"
    >
      <TracingHeader
        displayLabel={letter.displayLabel}
        onBackToMenu={onBackToMenu}
        onNext={goNext}
      />
      <LetterTracer
        key={letter.id}
        letter={letter}
        showShadow={showShadow}
        isHardMode={isHardMode}
      />
    </main>
  );
}
