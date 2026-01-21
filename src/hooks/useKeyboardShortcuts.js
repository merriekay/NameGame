import { useEffect } from 'react';

/**
 * Custom hook for practice mode keyboard shortcuts
 */
export function useKeyboardShortcuts({
  mode,
  showingName,
  setShowingName,
  nextCard,
  prevCard,
  markCorrect,
  markIncorrect,
}) {
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (mode !== "practice") return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          setShowingName(!showingName);
          break;
        case "ArrowRight":
          nextCard();
          break;
        case "ArrowLeft":
          prevCard();
          break;
        case "y":
        case "Y":
          if (showingName) markCorrect();
          break;
        case "n":
        case "N":
          if (showingName) markIncorrect();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [mode, showingName, setShowingName, nextCard, prevCard, markCorrect, markIncorrect]);
}
