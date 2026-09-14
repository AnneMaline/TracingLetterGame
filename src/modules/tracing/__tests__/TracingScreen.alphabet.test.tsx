import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { letters } from "../../../data/letterSegments";
import { TracingScreen } from "../TracingScreen";

describe("TracingScreen smoke test — every letter renders (task 003)", () => {
  it("renders each letter's start/end/arrow markers when navigated to", () => {
    render(<TracingScreen letters={letters} />);
    expect(screen.getByTestId("current-letter-label")).toHaveTextContent("A");
    expect(screen.getByTestId("segment-guide-start")).toBeInTheDocument();
    expect(screen.getByTestId("segment-guide-end")).toBeInTheDocument();

    const nextButton = screen.getByTestId("next-letter");
    // 25 clicks brings us from A to Z; a final click wraps back to A.
    for (let i = 1; i < letters.length; i++) {
      fireEvent.click(nextButton);
      expect(screen.getByTestId("current-letter-label")).toHaveTextContent(
        letters[i].displayLabel,
      );
      expect(screen.getByTestId("segment-guide-start")).toBeInTheDocument();
      expect(screen.getByTestId("segment-guide-end")).toBeInTheDocument();
      expect(screen.getByTestId("segment-guide-arrow")).toBeInTheDocument();
    }

    fireEvent.click(nextButton);
    expect(screen.getByTestId("current-letter-label")).toHaveTextContent(
      letters[0].displayLabel,
    );
  });
});
