import React from "react";
import type { LetterDefinition } from "../../types";
import { LetterTile } from "./LetterTile";

interface Props {
  letters: LetterDefinition[];
  isHardMode: boolean;
  onToggleHardMode: () => void;
  onSelectLetter: (index: number) => void;
}

export function LetterSelectionScreen({
  letters,
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
          position: "relative",
          width: "100%",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <button
          type="button"
          data-testid="hard-mode-toggle"
          role="switch"
          aria-checked={isHardMode}
          onClick={onToggleHardMode}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            border: "none",
            borderRadius: "999px",
            padding: "0.4rem 0.9rem",
            background: isHardMode ? "#17324d" : "#e2e8f0",
            color: isHardMode ? "#ffffff" : "#334155",
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
              background: isHardMode ? "#4ade80" : "#94a3b8",
              position: "relative",
              transition: "background 0.15s ease",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: "0.15rem",
                left: isHardMode ? "1.05rem" : "0.15rem",
                width: "0.8rem",
                height: "0.8rem",
                borderRadius: "50%",
                background: "#ffffff",
                transition: "left 0.15s ease",
              }}
            />
          </span>
          Hard mode
        </button>
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
