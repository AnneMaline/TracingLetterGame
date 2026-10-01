import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../App";

describe("App full navigation flow (M3 Letter selection + Tracing navigation)", () => {
  it("boots to LetterSelectionScreen, launches selected letter, advances with Next, and returns to Menu", () => {
    render(<App />);

    // 1. Initial boot should display letter selection menu
    expect(screen.getByTestId("letter-selection-screen")).toBeInTheDocument();
    expect(screen.getByTestId("letter-tile-A")).toBeInTheDocument();
    expect(screen.getByTestId("letter-tile-C")).toBeInTheDocument();

    // 2. Click letter "C"
    fireEvent.click(screen.getByTestId("letter-tile-C"));

    // 3. TracingScreen opens for letter "C"
    expect(screen.getByTestId("tracing-screen")).toBeInTheDocument();
    expect(screen.getByTestId("current-letter-indicator")).toHaveTextContent(
      "Letter C",
    );

    // 4. Click Next -> advances to letter "D"
    fireEvent.click(screen.getByTestId("next-letter"));
    expect(screen.getByTestId("current-letter-indicator")).toHaveTextContent(
      "Letter D",
    );

    // 5. Click Menu -> returns to letter selection screen
    fireEvent.click(screen.getByTestId("menu-button"));
    expect(screen.getByTestId("letter-selection-screen")).toBeInTheDocument();
    expect(screen.queryByTestId("tracing-screen")).not.toBeInTheDocument();

    // 6. Click letter "Z" -> opens Tracing for "Z"
    fireEvent.click(screen.getByTestId("letter-tile-Z"));
    expect(screen.getByTestId("tracing-screen")).toBeInTheDocument();
    expect(screen.getByTestId("current-letter-indicator")).toHaveTextContent(
      "Letter Z",
    );

    // 7. Click Next on "Z" -> wraps to "A"
    fireEvent.click(screen.getByTestId("next-letter"));
    expect(screen.getByTestId("current-letter-indicator")).toHaveTextContent(
      "Letter A",
    );
  });
});

describe("App Hard mode toggle", () => {
  it("boots with Hard mode off and uses the standard letter fixtures", () => {
    render(<App />);

    const toggle = screen.getByTestId("hard-mode-toggle");
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });

  it("keeps the same letter fixtures in Hard mode (Hard mode only changes the shadow aid)", () => {
    render(<App />);

    fireEvent.click(screen.getByTestId("letter-tile-R"));
    expect(screen.getByTestId("progress-label")).toHaveTextContent(
      "Segment 1 of 3",
    );
    expect(screen.getByTestId("letter-shadow")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("menu-button"));
    fireEvent.click(screen.getByTestId("hard-mode-toggle"));
    expect(screen.getByTestId("hard-mode-toggle")).toHaveAttribute(
      "aria-checked",
      "true",
    );

    fireEvent.click(screen.getByTestId("letter-tile-R"));
    expect(screen.getByTestId("progress-label")).toHaveTextContent(
      "Segment 1 of 3",
    );
    // Hard mode opens with the shadow-only preview: no segment guide yet.
    expect(screen.getByTestId("letter-shadow")).toBeInTheDocument();
    expect(screen.queryByTestId("segment-guide")).not.toBeInTheDocument();
  });

  it("shows helplines toggle during hard-mode tracing and allows turning lines on", () => {
    render(<App />);

    fireEvent.click(screen.getByTestId("hard-mode-toggle"));
    fireEvent.click(screen.getByTestId("letter-tile-A"));

    const toggle = screen.getByTestId("helplines-toggle");
    expect(toggle).toHaveAttribute("aria-checked", "false");
    expect(screen.queryByTestId("helpline-top")).not.toBeInTheDocument();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(screen.getByTestId("helpline-top")).toBeInTheDocument();
  });
});

describe("App case toggle", () => {
  it("defaults to uppercase and can switch to lowercase letters", () => {
    render(<App />);

    const caseToggle = screen.getByTestId("case-toggle");
    expect(caseToggle).toHaveAttribute("aria-checked", "false");
    expect(screen.getByTestId("letter-tile-A")).toBeInTheDocument();
    expect(screen.queryByTestId("letter-tile-a")).not.toBeInTheDocument();

    fireEvent.click(caseToggle);

    expect(caseToggle).toHaveAttribute("aria-checked", "true");
    expect(screen.getByTestId("letter-tile-a")).toBeInTheDocument();
    expect(screen.queryByTestId("letter-tile-A")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("letter-tile-c"));
    expect(screen.getByTestId("current-letter-indicator")).toHaveTextContent(
      "Letter c",
    );
  });

  it("supports all hard-mode and case combinations", () => {
    const combinations = [
      {
        useHardMode: false,
        useLowercase: false,
        tileId: "letter-tile-A",
        expectedLabel: "Letter A",
      },
      {
        useHardMode: false,
        useLowercase: true,
        tileId: "letter-tile-a",
        expectedLabel: "Letter a",
      },
      {
        useHardMode: true,
        useLowercase: false,
        tileId: "letter-tile-A",
        expectedLabel: "Letter A",
      },
      {
        useHardMode: true,
        useLowercase: true,
        tileId: "letter-tile-a",
        expectedLabel: "Letter a",
      },
    ];

    for (const combination of combinations) {
      const { unmount } = render(<App />);

      if (combination.useHardMode) {
        fireEvent.click(screen.getByTestId("hard-mode-toggle"));
      }

      if (combination.useLowercase) {
        fireEvent.click(screen.getByTestId("case-toggle"));
      }

      fireEvent.click(screen.getByTestId(combination.tileId));
      expect(screen.getByTestId("tracing-screen")).toBeInTheDocument();
      expect(screen.getByTestId("current-letter-indicator")).toHaveTextContent(
        combination.expectedLabel,
      );

      fireEvent.click(screen.getByTestId("menu-button"));
      if (combination.useHardMode) {
        expect(screen.getByTestId("hard-mode-toggle")).toHaveAttribute(
          "aria-checked",
          "true",
        );
      }

      unmount();
    }
  });
});
