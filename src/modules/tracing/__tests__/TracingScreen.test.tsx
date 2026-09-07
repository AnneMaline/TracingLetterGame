import { fireEvent, render, screen } from "@testing-library/react";
import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import type { LetterDefinition } from "../../../types";
import { TracingScreen } from "../TracingScreen";

const A: LetterDefinition = {
  id: "A",
  displayLabel: "A",
  segments: [{ start: { x: 0.2, y: 0.5 }, end: { x: 0.8, y: 0.5 } }],
};
const B: LetterDefinition = {
  id: "B",
  displayLabel: "B",
  segments: [{ start: { x: 0.2, y: 0.1 }, end: { x: 0.2, y: 0.9 } }],
};
const C: LetterDefinition = {
  id: "C",
  displayLabel: "C",
  segments: [{ start: { x: 0.3, y: 0.1 }, end: { x: 0.7, y: 0.1 } }],
};

function mockRect(el: SVGSVGElement) {
  vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 500,
    bottom: 500,
    width: 500,
    height: 500,
    toJSON: () => ({}),
  } as DOMRect);
  el.setPointerCapture = vi.fn();
  el.releasePointerCapture = vi.fn();
  el.hasPointerCapture = vi.fn().mockReturnValue(true);
}

function toClient(x: number, y: number) {
  return { clientX: x * 500, clientY: y * 500 };
}

// T-009
describe("Tracing screen renders start/direction/end markers (T-009)", () => {
  it("renders SegmentGuide markers for the current segment", () => {
    render(<TracingScreen letters={[A]} />);
    expect(screen.getByTestId("segment-guide-start")).toBeInTheDocument();
    expect(screen.getByTestId("segment-guide-end")).toBeInTheDocument();
    expect(screen.getByTestId("segment-guide-arrow")).toBeInTheDocument();
  });
});

// T-010
describe("Next/Previous cycle through letters (T-010)", () => {
  it("advances forward through every letter and wraps to first", () => {
    render(<TracingScreen letters={[A, B, C]} />);
    expect(screen.getByTestId("current-letter-label")).toHaveTextContent("A");
    fireEvent.click(screen.getByTestId("next-letter"));
    expect(screen.getByTestId("current-letter-label")).toHaveTextContent("B");
    fireEvent.click(screen.getByTestId("next-letter"));
    expect(screen.getByTestId("current-letter-label")).toHaveTextContent("C");
    fireEvent.click(screen.getByTestId("next-letter"));
    expect(screen.getByTestId("current-letter-label")).toHaveTextContent("A");
  });

  it("previous from first wraps to last, then walks backward", () => {
    render(<TracingScreen letters={[A, B, C]} />);
    fireEvent.click(screen.getByTestId("prev-letter"));
    expect(screen.getByTestId("current-letter-label")).toHaveTextContent("C");
    fireEvent.click(screen.getByTestId("prev-letter"));
    expect(screen.getByTestId("current-letter-label")).toHaveTextContent("B");
  });
});

// T-013
describe("Celebration triggers exactly once on letter completion (T-013)", () => {
  it("shows celebration after tracing all segments to >=80%", async () => {
    vi.useFakeTimers();
    render(<TracingScreen letters={[A]} />);
    const surface = screen.getByTestId(
      "trace-surface",
    ) as unknown as SVGSVGElement;
    mockRect(surface);

    // Trace segment 1 of A: horizontal at y=0.5 from x=0.2 to x=0.8
    fireEvent.pointerDown(surface, { pointerId: 1, ...toClient(0.2, 0.5) });
    for (let t = 0; t <= 1; t += 0.1) {
      fireEvent.pointerMove(surface, {
        pointerId: 1,
        ...toClient(0.2 + 0.6 * t, 0.5),
      });
    }
    fireEvent.pointerUp(surface, { pointerId: 1, ...toClient(0.8, 0.5) });

    // 250ms segment-complete → letter-complete
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    // 500ms pause before celebration appears (scheduled in a follow-up useEffect)
    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    expect(screen.getByTestId("celebration")).toBeInTheDocument();

    // Advance celebration duration; it should disappear (fired exactly once)
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.queryByTestId("celebration")).not.toBeInTheDocument();

    vi.useRealTimers();
  });
});

// T-014 (integration variant per task 001 scope)
describe("Happy-path full letter trace (T-014)", () => {
  it("traces every segment of a multi-segment letter and reaches letter-complete", async () => {
    vi.useFakeTimers();
    const twoSeg: LetterDefinition = {
      id: "H",
      displayLabel: "H",
      segments: [
        { start: { x: 0.3, y: 0.1 }, end: { x: 0.3, y: 0.9 } },
        { start: { x: 0.7, y: 0.1 }, end: { x: 0.7, y: 0.9 } },
      ],
    };
    render(<TracingScreen letters={[twoSeg]} />);
    const surface = screen.getByTestId(
      "trace-surface",
    ) as unknown as SVGSVGElement;
    mockRect(surface);

    // Segment 1: vertical at x=0.3
    fireEvent.pointerDown(surface, { pointerId: 1, ...toClient(0.3, 0.1) });
    for (let t = 0; t <= 1; t += 0.1) {
      fireEvent.pointerMove(surface, {
        pointerId: 1,
        ...toClient(0.3, 0.1 + 0.8 * t),
      });
    }
    fireEvent.pointerUp(surface, { pointerId: 1, ...toClient(0.3, 0.9) });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByTestId("progress-label")).toHaveTextContent(
      "Segment 2 of 2",
    );

    // Segment 2: vertical at x=0.7
    fireEvent.pointerDown(surface, { pointerId: 2, ...toClient(0.7, 0.1) });
    for (let t = 0; t <= 1; t += 0.1) {
      fireEvent.pointerMove(surface, {
        pointerId: 2,
        ...toClient(0.7, 0.1 + 0.8 * t),
      });
    }
    fireEvent.pointerUp(surface, { pointerId: 2, ...toClient(0.7, 0.9) });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    await act(async () => {
      vi.advanceTimersByTime(600);
    });
    expect(screen.getByTestId("celebration")).toBeInTheDocument();
    vi.useRealTimers();
  });
});

// bonus: exit-box mid-drag resets the segment (state machine correctness)
describe("Boundary-box exit resets the current segment", () => {
  it("stops feedback and returns to awaiting-start (via segment-reset)", () => {
    render(<TracingScreen letters={[A]} />);
    const surface = screen.getByTestId(
      "trace-surface",
    ) as unknown as SVGSVGElement;
    mockRect(surface);

    fireEvent.pointerDown(surface, { pointerId: 1, ...toClient(0.2, 0.5) });
    fireEvent.pointerMove(surface, { pointerId: 1, ...toClient(0.4, 0.5) });
    fireEvent.pointerMove(surface, { pointerId: 1, ...toClient(0.5, 0.9) });

    expect(surface.getAttribute("data-segment-status")).toBe("segment-reset");
    expect(screen.queryByTestId("trace-feedback")).not.toBeInTheDocument();
  });
});
