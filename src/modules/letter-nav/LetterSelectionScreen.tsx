import React from "react";
import type { LetterDefinition } from "../../types";
import { LetterTile } from "./LetterTile";

interface Props {
  letters: LetterDefinition[];
  onSelectLetter: (index: number) => void;
}

export function LetterSelectionScreen({ letters, onSelectLetter }: Props) {
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
