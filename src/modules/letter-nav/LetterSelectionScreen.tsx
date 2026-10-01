import type { LetterCase, LetterDefinition } from "../../types";
import { ToggleSwitch } from "../../shared/ToggleSwitch";
import { LetterTile } from "./LetterTile";

interface Props {
  letters: LetterDefinition[];
  selectedCase: LetterCase;
  onToggleCase: () => void;
  isHardMode: boolean;
  onToggleHardMode: () => void;
  onSelectLetter: (index: number) => void;
}

export function LetterSelectionScreen({
  letters,
  selectedCase,
  onToggleCase,
  isHardMode,
  onToggleHardMode,
  onSelectLetter,
}: Props) {
  return (
    <main
      data-testid="letter-selection-screen"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "2rem 1rem",
        gap: "1.5rem",
        background: "#f4f7fb",
      }}
    >
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <ToggleSwitch
          testId="case-toggle"
          checked={selectedCase === "lowercase"}
          onToggle={onToggleCase}
          label={selectedCase === "uppercase" ? "Uppercase" : "Lowercase"}
        />
        <ToggleSwitch
          testId="hard-mode-toggle"
          checked={isHardMode}
          onToggle={onToggleHardMode}
          label="Hard mode"
        />
      </div>

      <header style={{ textAlign: "center" }}>
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 800,
            color: "#17324d",
            margin: "0 0 0.5rem 0",
          }}
        >
          TraceQuest
        </h1>
        <p
          style={{
            fontSize: "1.125rem",
            color: "#566b82",
            margin: 0,
          }}
        >
          Choose a letter to trace
        </p>
      </header>

      <section
        aria-label="Alphabet selection"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(64px, 1fr))",
          gap: "1rem",
          width: "100%",
          maxWidth: "560px",
          padding: "1rem",
        }}
      >
        {letters.map((letter, index) => (
          <LetterTile
            key={letter.id}
            letter={letter}
            index={index}
            onSelect={onSelectLetter}
          />
        ))}
      </section>
    </main>
  );
}
