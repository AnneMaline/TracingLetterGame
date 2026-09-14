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
    expect(screen.getByTestId("current-letter-indicator")).toHaveTextContent("Letter C");

    // 4. Click Next -> advances to letter "D"
    fireEvent.click(screen.getByTestId("next-letter"));
    expect(screen.getByTestId("current-letter-indicator")).toHaveTextContent("Letter D");

    // 5. Click Menu -> returns to letter selection screen
    fireEvent.click(screen.getByTestId("menu-button"));
    expect(screen.getByTestId("letter-selection-screen")).toBeInTheDocument();
    expect(screen.queryByTestId("tracing-screen")).not.toBeInTheDocument();

    // 6. Click letter "Z" -> opens Tracing for "Z"
    fireEvent.click(screen.getByTestId("letter-tile-Z"));
    expect(screen.getByTestId("tracing-screen")).toBeInTheDocument();
    expect(screen.getByTestId("current-letter-indicator")).toHaveTextContent("Letter Z");

    // 7. Click Next on "Z" -> wraps to "A"
    fireEvent.click(screen.getByTestId("next-letter"));
    expect(screen.getByTestId("current-letter-indicator")).toHaveTextContent("Letter A");
  });
});
