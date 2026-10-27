import { useCallback, useState } from "react";
import type { LetterDefinition } from "../../types";
import { LetterTracer } from "./LetterTracer";
import { TracingHeader } from "./TracingHeader";

interface Props {
  letters: LetterDefinition[];
  initialLetterIndex?: number;
  onBackToMenu?: () => void;
  onTrain?: () => void;
  onLetterComplete?: () => void;
  isHardMode?: boolean;
  mode?: "run" | "train";
}

export function TracingScreen({
  letters,
  initialLetterIndex = 0,
  onBackToMenu,
  onTrain,
  onLetterComplete,
  isHardMode = false,
  mode = "train",
}: Props) {
  const [trainLetterIndex, setTrainLetterIndex] = useState(initialLetterIndex);
  const letterIndex = mode === "run" ? initialLetterIndex : trainLetterIndex;
  const [showHelplines, setShowHelplines] = useState(false);
  const total = letters.length;
  const letter = letters[letterIndex];

  const goNext = useCallback(() => {
    setTrainLetterIndex((i) => (i + 1) % total);
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
        mode={mode}
        displayLabel={letter.displayLabel}
        onBackToMenu={onBackToMenu}
        onNext={goNext}
        onTrain={onTrain}
        showHelplines={showHelplines}
        onToggleHelplines={() => setShowHelplines((v) => !v)}
      />
      <LetterTracer
        key={letter.id}
        letter={letter}
        isHardMode={mode === "train" && isHardMode}
        showHelplines={mode === "run" || showHelplines}
        onLetterComplete={onLetterComplete ?? goNext}
      />
    </main>
  );
}
