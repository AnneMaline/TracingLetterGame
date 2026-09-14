import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { LetterDefinition } from "../../../types";
import { LetterSelectionScreen } from "../LetterSelectionScreen";

const sampleLetters: LetterDefinition[] = [
  { id: "A", displayLabel: "A", segments: [{ start: { x: 0.2, y: 0.5 }, end: { x: 0.8, y: 0.5 } }] },
  { id: "B", displayLabel: "B", segments: [{ start: { x: 0.2, y: 0.1 }, end: { x: 0.2, y: 0.9 } }] },
  { id: "C", displayLabel: "C", segments: [{ start: { x: 0.3, y: 0.1 }, end: { x: 0.7, y: 0.1 } }] },
];

describe("LetterSelectionScreen (T-011)", () => {
  it("renders all letter tiles", () => {
    const onSelect = vi.fn();
    render(<LetterSelectionScreen letters={sampleLetters} onSelectLetter={onSelect} />);

    expect(screen.getByTestId("letter-selection-screen")).toBeInTheDocument();
    expect(screen.getByTestId("letter-tile-A")).toBeInTheDocument();
    expect(screen.getByTestId("letter-tile-B")).toBeInTheDocument();
    expect(screen.getByTestId("letter-tile-C")).toBeInTheDocument();
  });

  it("calls onSelectLetter with corresponding index when a tile is clicked", () => {
    const onSelect = vi.fn();
    render(<LetterSelectionScreen letters={sampleLetters} onSelectLetter={onSelect} />);

    fireEvent.click(screen.getByTestId("letter-tile-B"));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(1);
  });
});
