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

  it("switches to the harder letter fixtures once Hard mode is enabled", () => {
    render(<App />);

    // R has 3 traceable segments in the standard fixture set.
    fireEvent.click(screen.getByTestId("letter-tile-R"));
    expect(screen.getByTestId("progress-label")).toHaveTextContent(
      "Segment 1 of 3",
    );

    fireEvent.click(screen.getByTestId("menu-button"));
    fireEvent.click(screen.getByTestId("hard-mode-toggle"));
    expect(screen.getByTestId("hard-mode-toggle")).toHaveAttribute(
      "aria-checked",
      "true",
    );

    // R has 2 traceable segments (a continuous bowl+leg stroke) in Hard mode.
    fireEvent.click(screen.getByTestId("letter-tile-R"));
    expect(screen.getByTestId("progress-label")).toHaveTextContent(
      "Segment 1 of 2",
    );
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
