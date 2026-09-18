import { useCallback, useEffect, useRef, useState } from "react";
import { letters } from "./data/letterSegments";
import { emitContainerEvent } from "./integration/containerBridge";
import { LetterSelectionScreen } from "./modules/letter-nav/LetterSelectionScreen";
import { TracingScreen } from "./modules/tracing/TracingScreen";

type Screen = "menu" | "tracing";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("menu");
  const [selectedLetterIndex, setSelectedLetterIndex] = useState(0);
  const completedLetterIds = useRef(new Set<string>());
  const sessionEventSent = useRef(false);

  useEffect(() => {
    const handlePageHide = () => {
      if (sessionEventSent.current || completedLetterIds.current.size === 0)
        return;

      sessionEventSent.current = true;
      emitContainerEvent({
        type: "session_complete",
        payload: { lettersCompleted: completedLetterIds.current.size },
      });
    };

    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, []);

  const handleSelectLetter = (index: number) => {
    setSelectedLetterIndex(index);
    setCurrentScreen("tracing");
  };

  const handleBackToMenu = useCallback(() => {
    setCurrentScreen("menu");
  }, []);

  const handleSegmentComplete = useCallback(
    (letterId: string, segmentIndex: number) => {
      emitContainerEvent({
        type: "segment_complete",
        payload: { letterId, segmentIndex },
      });
    },
    [],
  );

  const handleLetterComplete = useCallback((letterId: string) => {
    completedLetterIds.current.add(letterId);
    emitContainerEvent({
      type: "letter_complete",
      payload: { letterId },
    });
  }, []);

  if (currentScreen === "menu") {
    return (
      <LetterSelectionScreen
        letters={letters}
        onSelectLetter={handleSelectLetter}
      />
    );
  }

  return (
    <TracingScreen
      letters={letters}
      initialLetterIndex={selectedLetterIndex}
      onBackToMenu={handleBackToMenu}
      onSegmentComplete={handleSegmentComplete}
      onLetterComplete={handleLetterComplete}
    />
  );
}
