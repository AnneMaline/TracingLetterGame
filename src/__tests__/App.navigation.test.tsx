import { fireEvent, render, screen } from "@testing-library/react";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { languagePacks } from "../data/languagePacks";
import type { LanguageContent, LetterDefinition } from "../types";
import {
  AUTO_ADVANCE_DELAY_MS,
  CELEBRATION_DELAY_MS,
  CELEBRATION_DURATION_MS,
  ROUND_COMPLETE_DISPLAY_MS,
  SEGMENT_ADVANCE_DELAY_MS,
} from "../shared/constants";

const renderApp = () => render(<App content={languagePacks.english} />);

const makeLetter = (id: string): LetterDefinition => ({
  id,
  displayLabel: id,
  segments: [{ start: { x: 0.2, y: 0.5 }, end: { x: 0.8, y: 0.5 } }],
});

const flowContent: LanguageContent = {
  lowercase: [makeLetter("a"), makeLetter("z")],
  uppercase: [makeLetter("A"), makeLetter("Z")],
};

function prepareSurface() {
  const surface = screen.getByTestId(
    "trace-surface",
  ) as unknown as SVGSVGElement;
  const isLowercase = /^[a-z]$/.test(surface.getAttribute("data-letter-id")!);
  const height = isLowercase ? 680 : 500;
  vi.spyOn(surface, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 500,
    bottom: height,
    width: 500,
    height,
    toJSON: () => ({}),
  } as DOMRect);
  surface.setPointerCapture = vi.fn();
  surface.releasePointerCapture = vi.fn();
  surface.hasPointerCapture = vi.fn().mockReturnValue(true);
  return surface;
}

async function completeVisibleLetter() {
  const surface = prepareSurface();
  fireEvent.pointerDown(surface, {
    pointerId: 1,
    clientX: 100,
    clientY: 250,
  });
  for (let t = 0; t <= 1; t += 0.1) {
    fireEvent.pointerMove(surface, {
      pointerId: 1,
      clientX: 100 + 300 * t,
      clientY: 250,
    });
  }
  fireEvent.pointerUp(surface, {
    pointerId: 1,
    clientX: 400,
    clientY: 250,
  });
  await act(async () => {
    vi.advanceTimersByTime(SEGMENT_ADVANCE_DELAY_MS);
  });
}

async function advanceTimers(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
}

async function advanceThroughLetterCelebration() {
  await advanceTimers(CELEBRATION_DELAY_MS);
  await advanceTimers(CELEBRATION_DURATION_MS);
  await advanceTimers(AUTO_ADVANCE_DELAY_MS);
}

afterEach(() => vi.useRealTimers());

describe("App navigation: run and Train", () => {
  it("opens on lowercase a; Train opens lowercase selection and preserves Train navigation", () => {
    renderApp();

    expect(screen.getByTestId("tracing-screen")).toBeInTheDocument();
    expect(screen.getByTestId("current-letter-indicator")).toHaveTextContent(
      "Letter a",
    );
    fireEvent.click(screen.getByTestId("train-button"));

    expect(screen.getByTestId("letter-selection-screen")).toBeInTheDocument();
    expect(screen.getByTestId("case-toggle")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByTestId("letter-tile-a")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("letter-tile-c"));
    expect(screen.getByTestId("current-letter-indicator")).toHaveTextContent(
      "Letter c",
    );

    fireEvent.click(screen.getByTestId("next-letter"));
    expect(screen.getByTestId("current-letter-indicator")).toHaveTextContent(
      "Letter d",
    );
    fireEvent.click(screen.getByTestId("menu-button"));
    expect(screen.getByTestId("letter-selection-screen")).toBeInTheDocument();
  });

  it("keeps the Hard mode and helplines controls available in Train", () => {
    renderApp();
    fireEvent.click(screen.getByTestId("train-button"));
    fireEvent.click(screen.getByTestId("hard-mode-toggle"));
    expect(screen.getByTestId("hard-mode-toggle")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    fireEvent.click(screen.getByTestId("case-toggle"));
    fireEvent.click(screen.getByTestId("letter-tile-R"));

    const toggle = screen.getByTestId("helplines-toggle");
    expect(toggle).toHaveAttribute("aria-checked", "false");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(screen.getByTestId("helpline-top")).toBeInTheDocument();
  });
});

describe("Guided alphabet run", () => {
  it("T-041: Train is icon-only and opens lowercase selection with Hard mode", () => {
    render(<App content={flowContent} />);
    const trainButton = screen.getByTestId("train-button");
    expect(trainButton).toHaveAttribute("aria-label", "Train");
    expect(trainButton).toHaveTextContent("");
    expect(screen.queryByTestId("start-button")).not.toBeInTheDocument();

    fireEvent.click(trainButton);
    expect(screen.getByTestId("case-toggle")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByTestId("hard-mode-toggle")).toBeInTheDocument();
  });

  it("T-042: starts at lowercase a with helplines and only the Train button", () => {
    render(<App content={flowContent} />);
    expect(screen.getByTestId("current-letter-indicator")).toHaveTextContent(
      "Letter a",
    );
    expect(screen.getByTestId("trace-surface")).toHaveAttribute(
      "data-segment-index",
      "0",
    );
    expect(screen.getByTestId("helpline-top")).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.queryByTestId("next-letter")).not.toBeInTheDocument();
    expect(screen.queryByTestId("menu-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("helplines-toggle")).not.toBeInTheDocument();
  });

  it("T-043: waits for completion, keeps the finished letter visible, then advances 1 second after the animation", async () => {
    vi.useFakeTimers();
    render(<App content={flowContent} />);

    await advanceTimers(
      CELEBRATION_DELAY_MS + CELEBRATION_DURATION_MS + AUTO_ADVANCE_DELAY_MS,
    );
    expect(screen.getByTestId("current-letter-indicator")).toHaveTextContent(
      "Letter a",
    );

    await completeVisibleLetter();
    expect(screen.getByTestId("trace-surface")).toHaveAttribute(
      "data-segment-status",
      "letter-complete",
    );
    await advanceTimers(CELEBRATION_DELAY_MS);
    expect(screen.getByTestId("celebration")).toBeInTheDocument();
    await advanceTimers(CELEBRATION_DURATION_MS);
    expect(screen.queryByTestId("celebration")).not.toBeInTheDocument();
    await advanceTimers(AUTO_ADVANCE_DELAY_MS - 1);
    expect(screen.getByTestId("current-letter-indicator")).toHaveTextContent(
      "Letter a",
    );
    await advanceTimers(1);
    expect(screen.getByTestId("current-letter-indicator")).toHaveTextContent(
      "Letter z",
    );
  });

  it("T-044/T-045: celebrates between cases and loops from uppercase Z to lowercase a", async () => {
    vi.useFakeTimers();
    render(<App content={flowContent} />);

    await completeVisibleLetter();
    await advanceThroughLetterCelebration();
    expect(screen.getByTestId("current-letter-indicator")).toHaveTextContent(
      "Letter z",
    );
    await completeVisibleLetter();
    await advanceThroughLetterCelebration();

    expect(screen.getByTestId("round-complete-screen")).toHaveTextContent(
      "You did it!",
    );
    expect(screen.getByTestId("round-complete-image")).toBeInTheDocument();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    await advanceTimers(ROUND_COMPLETE_DISPLAY_MS);
    expect(screen.getByTestId("current-letter-indicator")).toHaveTextContent(
      "Letter A",
    );

    await completeVisibleLetter();
    await advanceThroughLetterCelebration();
    expect(screen.getByTestId("current-letter-indicator")).toHaveTextContent(
      "Letter Z",
    );
    await completeVisibleLetter();
    await advanceThroughLetterCelebration();
    expect(screen.getByTestId("round-complete-screen")).toBeInTheDocument();
    await advanceTimers(ROUND_COMPLETE_DISPLAY_MS);
    expect(screen.getByTestId("current-letter-indicator")).toHaveTextContent(
      "Letter a",
    );
  });

  it("T-046: Train drops the run; Home restarts at lowercase a", () => {
    render(<App content={flowContent} />);
    fireEvent.click(screen.getByTestId("train-button"));
    fireEvent.click(screen.getByTestId("case-toggle"));
    fireEvent.click(screen.getByTestId("letter-tile-Z"));
    expect(screen.getByTestId("current-letter-indicator")).toHaveTextContent(
      "Letter Z",
    );

    fireEvent.click(screen.getByTestId("menu-button"));
    fireEvent.click(screen.getByTestId("home-button"));
    expect(screen.getByTestId("current-letter-indicator")).toHaveTextContent(
      "Letter a",
    );
    expect(screen.getByTestId("train-button")).toBeInTheDocument();
  });

  it("automatically advances in Train while keeping its manual Next control", async () => {
    vi.useFakeTimers();
    render(<App content={flowContent} />);
    fireEvent.click(screen.getByTestId("train-button"));
    fireEvent.click(screen.getByTestId("letter-tile-a"));

    await completeVisibleLetter();
    await advanceTimers(CELEBRATION_DELAY_MS);
    await advanceTimers(CELEBRATION_DURATION_MS);
    await advanceTimers(AUTO_ADVANCE_DELAY_MS - 1);
    expect(screen.getByTestId("current-letter-indicator")).toHaveTextContent(
      "Letter a",
    );
    expect(screen.getByTestId("next-letter")).toBeInTheDocument();

    await advanceTimers(1);
    expect(screen.getByTestId("current-letter-indicator")).toHaveTextContent(
      "Letter z",
    );
    expect(screen.getByTestId("helplines-toggle")).toBeInTheDocument();
  });
});
