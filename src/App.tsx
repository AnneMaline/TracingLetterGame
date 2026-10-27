import { useCallback, useState } from "react";
import type { LanguageContent, LetterCase } from "./types";
import { RoundCompleteScreen } from "./modules/game-flow/RoundCompleteScreen";
import { LetterSelectionScreen } from "./modules/letter-nav/LetterSelectionScreen";
import { TracingScreen } from "./modules/tracing/TracingScreen";

type Screen = "menu" | "tracing" | "round-complete";
type Mode = "run" | "train";

interface Props {
  content: LanguageContent;
}

export default function App({ content }: Props) {
  const [currentScreen, setCurrentScreen] = useState<Screen>("tracing");
  const [mode, setMode] = useState<Mode>("run");
  const [selectedLetterIndex, setSelectedLetterIndex] = useState(0);
  const [isHardMode, setIsHardMode] = useState(false);
  const [selectedCase, setSelectedCase] = useState<LetterCase>("lowercase");
  const [runCase, setRunCase] = useState<LetterCase>("lowercase");
  const [runLetterIndex, setRunLetterIndex] = useState(0);

  const trainLetters =
    selectedCase === "uppercase" ? content.uppercase : content.lowercase;
  const runLetters =
    runCase === "uppercase" ? content.uppercase : content.lowercase;

  const handleSelectLetter = (index: number) => {
    setSelectedLetterIndex(index);
    setMode("train");
    setCurrentScreen("tracing");
  };

  const handleBackToMenu = () => {
    setCurrentScreen("menu");
  };

  const handleOpenTrain = () => {
    setMode("train");
    setCurrentScreen("menu");
  };

  const handleStartRun = () => {
    setMode("run");
    setRunCase("lowercase");
    setRunLetterIndex(0);
    setCurrentScreen("tracing");
  };

  const handleRunLetterComplete = useCallback(() => {
    if (runLetterIndex + 1 < runLetters.length) {
      setRunLetterIndex((index) => index + 1);
      return;
    }
    setCurrentScreen("round-complete");
  }, [runLetterIndex, runLetters.length]);

  const handleRoundComplete = useCallback(() => {
    setRunCase((currentCase) =>
      currentCase === "lowercase" ? "uppercase" : "lowercase",
    );
    setRunLetterIndex(0);
    setCurrentScreen("tracing");
  }, []);

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
        letters={trainLetters}
        selectedCase={selectedCase}
        onToggleCase={handleToggleCase}
        isHardMode={isHardMode}
        onToggleHardMode={handleToggleHardMode}
        onSelectLetter={handleSelectLetter}
        onHome={handleStartRun}
      />
    );
  }

  if (currentScreen === "round-complete") {
    return <RoundCompleteScreen onComplete={handleRoundComplete} />;
  }

  return (
    <TracingScreen
      mode={mode}
      letters={mode === "run" ? runLetters : trainLetters}
      initialLetterIndex={
        mode === "run" ? runLetterIndex : selectedLetterIndex
      }
      onBackToMenu={handleBackToMenu}
      onTrain={handleOpenTrain}
      onLetterComplete={
        mode === "run" ? handleRunLetterComplete : undefined
      }
      isHardMode={mode === "train" && isHardMode}
    />
  );
}
