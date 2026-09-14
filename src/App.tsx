import { useState } from "react";
import { letters } from "./data/letterSegments";
import { LetterSelectionScreen } from "./modules/letter-nav/LetterSelectionScreen";
import { TracingScreen } from "./modules/tracing/TracingScreen";

type Screen = "menu" | "tracing";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("menu");
  const [selectedLetterIndex, setSelectedLetterIndex] = useState(0);

  const handleSelectLetter = (index: number) => {
    setSelectedLetterIndex(index);
    setCurrentScreen("tracing");
  };

  const handleBackToMenu = () => {
    setCurrentScreen("menu");
  };

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
    />
  );
}
