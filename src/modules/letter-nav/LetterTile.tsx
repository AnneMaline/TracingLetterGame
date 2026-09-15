import React from "react";
import type { LetterDefinition } from "../../types";

interface Props {
  letter: LetterDefinition;
  index: number;
  onSelect: (index: number) => void;
}

export function LetterTile({ letter, index, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={() => onSelect(index)}
      data-testid={`letter-tile-${letter.id}`}
      aria-label={`Trace letter ${letter.displayLabel}`}
      className="flex items-center justify-center font-bold transition-transform active:scale-95 focus:outline-none focus:ring-4 focus:ring-blue-400"
      style={{
        minWidth: 64,
        minHeight: 64,
        fontSize: "2rem",
        fontWeight: 700,
        borderRadius: 16,
        border: "2px solid #17324d",
        background: "#fffdf6",
        color: "#17324d",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
        cursor: "pointer",
      }}
    >
      {letter.displayLabel}
    </button>
  );
}
