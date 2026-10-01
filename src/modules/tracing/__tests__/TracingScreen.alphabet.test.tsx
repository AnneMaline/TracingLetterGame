import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { letters as uppercaseLetters } from "../../../data/letterSegments/english/capitalLetters";
import { letters as lowercaseLetters } from "../../../data/letterSegments/english/lowercaseLetters";
import { TracingScreen } from "../TracingScreen";

describe("TracingScreen smoke test — every letter renders (task 003)", () => {
  it("renders each letter's start/end/arrow markers when navigated to", () => {
    render(<TracingScreen letters={uppercaseLetters} />);
    expect(screen.getByTestId("current-letter-indicator")).toHaveTextContent(
      "Letter A",
    );
    expect(screen.getByTestId("segment-guide-start")).toBeInTheDocument();
    expect(screen.getByTestId("segment-guide-end")).toBeInTheDocument();

    const nextButton = screen.getByTestId("next-letter");
    // 25 clicks brings us from A to Z; a final click wraps back to A.
    for (let i = 1; i < uppercaseLetters.length; i++) {
      fireEvent.click(nextButton);
      expect(screen.getByTestId("current-letter-indicator")).toHaveTextContent(
        `Letter ${uppercaseLetters[i].displayLabel}`,
      );
      expect(screen.getByTestId("segment-guide-start")).toBeInTheDocument();
      expect(screen.getByTestId("segment-guide-end")).toBeInTheDocument();
      expect(screen.getByTestId("segment-guide-arrow")).toBeInTheDocument();
    }

    fireEvent.click(nextButton);
    expect(screen.getByTestId("current-letter-indicator")).toHaveTextContent(
      `Letter ${uppercaseLetters[0].displayLabel}`,
    );
  });

  it("renders lowercase letters and wraps from z to a", () => {
    render(<TracingScreen letters={lowercaseLetters} />);
    expect(screen.getByTestId("current-letter-indicator")).toHaveTextContent(
      "Letter a",
    );
    expect(screen.getByTestId("trace-surface")).toHaveAttribute(
      "viewBox",
      "0 0 1 1.36",
    );

    const nextButton = screen.getByTestId("next-letter");
    for (let i = 1; i < lowercaseLetters.length; i++) {
      fireEvent.click(nextButton);
      expect(screen.getByTestId("current-letter-indicator")).toHaveTextContent(
        `Letter ${lowercaseLetters[i].displayLabel}`,
      );
    }

    fireEvent.click(nextButton);
    expect(screen.getByTestId("current-letter-indicator")).toHaveTextContent(
      `Letter ${lowercaseLetters[0].displayLabel}`,
    );
  });
});
