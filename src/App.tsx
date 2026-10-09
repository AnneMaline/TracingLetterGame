import { useState } from "react";
import type { LetterCase } from "./types";
import { letters as uppercaseLetters } from "./data/letterSegments/english/capitalLetters";
import { letters as lowercaseLetters } from "./data/letterSegments/english/lowercaseLetters";
import { LetterSelectionScreen } from "./modules/letter-nav/LetterSelectionScreen";
import { TracingScreen } from "./modules/tracing/TracingScreen";

type Screen = "menu" | "tracing";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("menu");
  const [selectedLetterIndex, setSelectedLetterIndex] = useState(0);
  const [isHardMode, setIsHardMode] = useState(false);
  const [selectedCase, setSelectedCase] = useState<LetterCase>("uppercase");

  const letters =
    selectedCase === "uppercase" ? uppercaseLetters : lowercaseLetters;

  const handleSelectLetter = (index: number) => {
    setSelectedLetterIndex(index);
    setCurrentScreen("tracing");
  };

  const handleBackToMenu = () => {
    setCurrentScreen("menu");
  };

  const handleToggleHardMode = () => {
    setIsHardMode((previous) => !previous);
  };

  const handleToggleCase = () => {
    setSelectedCase((previous) =>
      previous === "uppercase" ? "lowercase" : "uppercase",
    );
  };

  if (currentScreen === "menu") {
    return (
      <LetterSelectionScreen
        letters={letters}
        selectedCase={selectedCase}
        onToggleCase={handleToggleCase}
        isHardMode={isHardMode}
        onToggleHardMode={handleToggleHardMode}
        onSelectLetter={handleSelectLetter}
      />
    );
  }

  return (
    <TracingScreen
      letters={letters}
      initialLetterIndex={selectedLetterIndex}
      onBackToMenu={handleBackToMenu}
      isHardMode={isHardMode}
    />
  );
}
