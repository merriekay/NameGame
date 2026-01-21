import { useEffect, useCallback } from "react";
import { X } from "lucide-react";

// Hooks
import { useFlashcardState } from "../../hooks/useFlashcardState";
import { useDecks } from "../../hooks/useDecks";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";

// Services
import { processPDFRoster, processImageRoster } from "../../services/rosterParser";

// Utils
import { getFilteredCards } from "../../utils/deckStats";

// Pages
import HomePage from "./HomePage";
import DeckSelectPage from "./DeckSelectPage";
import ManualEntryPage from "./ManualEntryPage";
import RosterUploadPage from "./RosterUploadPage";
import PracticePage from "./PracticePage";

/**
 * Main Flashcard Application Component
 * Orchestrates all state, hooks, and page routing
 */
function FlashcardApp({ user, onLogout }) {
  const state = useFlashcardState();
  const deckOps = useDecks(state);

  // Load decks on mount
  useEffect(() => {
    deckOps.loadDecks();
  }, []);

  // Helper functions
  const getCurrentDeck = useCallback(() => {
    return state.decks.find(d => d._id === state.currentDeckId);
  }, [state.decks, state.currentDeckId]);

  const getCurrentDeckCards = useCallback(() => {
    const deck = getCurrentDeck();
    return getFilteredCards(deck, state.hideMastered);
  }, [getCurrentDeck, state.hideMastered]);

  // Manual card creation
  const addManualCard = async () => {
    if (!state.tempImage || !state.tempName.trim() || !state.tempDeckName.trim()) return;

    try {
      // Find or create deck
      let deck = state.decks.find(d => d.name === state.tempDeckName.trim());

      if (deck) {
        // Add to existing deck
        await deckOps.addCardToDeck(deck._id, state.tempName.trim(), state.tempImage);
      } else {
        // Create new deck with this card
        await deckOps.createDeck(state.tempDeckName.trim(), [{
          name: state.tempName.trim(),
          image: state.tempImage,
          progress: 0
        }]);
      }

      // Reset form
      state.setTempImage(null);
      state.setTempName("");
    } catch (err) {
      alert('Error adding card: ' + err.message);
    }
  };

  // Roster upload
  const handleRosterFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    state.setRosterFile(file);

    // Auto-suggest class name from filename
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
    state.setRosterClassName(nameWithoutExt.trim() || '');
  };

  const handleRosterUpload = async () => {
    if (!state.rosterFile || !state.rosterClassName.trim()) {
      alert('Please select a file and enter a class name');
      return;
    }

    state.setRosterProcessing(true);

    try {
      let newCards;
      if (state.rosterFile.type === 'application/pdf') {
        newCards = await processPDFRoster(state.rosterFile);
      } else {
        newCards = await processImageRoster(state.rosterFile);
      }

      // Create or update deck via API
      const existingDeck = state.decks.find(d => d.name === state.rosterClassName.trim());
      if (existingDeck) {
        // Add cards to existing deck
        const updatedCards = [...existingDeck.cards, ...newCards];
        await deckOps.updateDeck(existingDeck._id, { cards: updatedCards });
      } else {
        // Create new deck
        await deckOps.createDeck(state.rosterClassName.trim(), newCards);
      }

      state.setMode('home');
      alert(`Successfully imported ${newCards.length} students to deck "${state.rosterClassName.trim()}"!`);

      // Reset form
      state.setRosterFile(null);
      state.setRosterClassName('');
    } catch (error) {
      console.error('Error processing roster:', error);
      alert('Error processing roster. Please try manual entry or a different file format.');
    } finally {
      state.setRosterProcessing(false);
    }
  };

  // Practice mode functions
  const nextCard = useCallback(() => {
    state.setShowingName(false);
    const cards = getCurrentDeckCards();
    state.setCurrentCardIndex((state.currentCardIndex + 1) % cards.length);
  }, [state, getCurrentDeckCards]);

  const prevCard = useCallback(() => {
    state.setShowingName(false);
    const cards = getCurrentDeckCards();
    state.setCurrentCardIndex((state.currentCardIndex - 1 + cards.length) % cards.length);
  }, [state, getCurrentDeckCards]);

  const markCorrect = useCallback(async () => {
    const cards = getCurrentDeckCards();
    const card = cards[state.currentCardIndex];
    if (!card) return;

    state.setSessionStats((prev) => ({ ...prev, correct: prev.correct + 1 }));

    try {
      const newProgress = (card.progress || 0) + 1;
      await deckOps.updateCardProgress(state.currentDeckId, card._id, newProgress);
    } catch (err) {
      console.error('Error updating progress:', err);
    }

    nextCard();
  }, [state, getCurrentDeckCards, deckOps, nextCard]);

  const markIncorrect = useCallback(async () => {
    const cards = getCurrentDeckCards();
    const card = cards[state.currentCardIndex];
    if (!card) return;

    state.setSessionStats((prev) => ({ ...prev, incorrect: prev.incorrect + 1 }));

    try {
      await deckOps.updateCardProgress(state.currentDeckId, card._id, 0);
    } catch (err) {
      console.error('Error resetting progress:', err);
    }

    nextCard();
  }, [state, getCurrentDeckCards, deckOps, nextCard]);

  const resetProgress = async () => {
    state.setSessionStats({ correct: 0, incorrect: 0 });

    const deck = getCurrentDeck();
    if (deck) {
      try {
        const resetCards = deck.cards.map(c => ({ ...c, progress: 0 }));
        await deckOps.updateDeck(state.currentDeckId, { cards: resetCards });
      } catch (err) {
        console.error('Error resetting progress:', err);
      }
    }

    state.setCurrentCardIndex(0);
    state.setShowingName(false);
  };

  const shuffleCards = async () => {
    const deck = getCurrentDeck();
    if (!deck) return;

    const shuffled = [...deck.cards].sort(() => Math.random() - 0.5);
    try {
      await deckOps.updateDeck(state.currentDeckId, { cards: shuffled });
      state.setCurrentCardIndex(0);
      state.setShowingName(false);
    } catch (err) {
      console.error('Error shuffling cards:', err);
    }
  };

  // Edit card name
  const updateCardName = async (deckId, cardId, newName) => {
    const deck = state.decks.find(d => d._id === deckId);
    if (!deck) return;

    try {
      const updatedCards = deck.cards.map(c =>
        c._id === cardId ? { ...c, name: newName } : c
      );
      await deckOps.updateDeck(deckId, { cards: updatedCards });
      state.setEditingCardId(null);
      state.setEditingCardName("");
    } catch (err) {
      console.error('Error updating card name:', err);
      alert('Error updating card name: ' + err.message);
    }
  };

  // Keyboard shortcuts for practice mode
  useKeyboardShortcuts({
    mode: state.mode,
    showingName: state.showingName,
    setShowingName: state.setShowingName,
    nextCard,
    prevCard,
    markCorrect,
    markIncorrect,
  });

  // Loading state
  if (state.loading) {
    return (
      <div className="min-h-screen bg-editor-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent-blue mx-auto mb-4"></div>
          <p className="text-text-primary text-lg">Loading your decks...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (state.error) {
    return (
      <div className="min-h-screen bg-editor-bg flex items-center justify-center p-8">
        <div className="max-w-md bg-editor-bg-light border border-accent-red rounded-lg p-8 text-center">
          <X size={48} className="text-accent-red mx-auto mb-4" />
          <h2 className="text-xl font-bold text-text-primary mb-2">Error Loading Decks</h2>
          <p className="text-text-secondary mb-6">{state.error}</p>
          <button
            onClick={deckOps.loadDecks}
            className="bg-accent-blue hover:bg-accent-blue-hover text-white px-6 py-3 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Page routing
  if (state.mode === "home") {
    return (
      <HomePage
        user={user}
        onLogout={onLogout}
        decks={state.decks}
        onNavigate={state.setMode}
        editingCardId={state.editingCardId}
        editingCardName={state.editingCardName}
        onEditStart={(cardId, name) => {
          state.setEditingCardId(cardId);
          state.setEditingCardName(name);
        }}
        onEditSave={updateCardName}
        onEditCancel={() => {
          state.setEditingCardId(null);
          state.setEditingCardName("");
        }}
        onEditNameChange={state.setEditingCardName}
        onPracticeDeck={(deckId) => {
          state.setCurrentDeckId(deckId);
          state.setCurrentCardIndex(0);
          state.setMode("practice");
        }}
        onDeleteDeck={(deckId) => {
          deckOps.deleteDeck(deckId);
          if (state.currentDeckId === deckId) {
            state.setCurrentDeckId(null);
          }
        }}
      />
    );
  }

  if (state.mode === "deckSelect") {
    return (
      <DeckSelectPage
        decks={state.decks}
        onBack={() => state.setMode("home")}
        onSelectDeck={(deckId) => {
          state.setCurrentDeckId(deckId);
          state.setCurrentCardIndex(0);
          state.setSessionStats({ correct: 0, incorrect: 0 });
          state.setMode("practice");
        }}
      />
    );
  }

  if (state.mode === "manual") {
    return (
      <ManualEntryPage
        decks={state.decks}
        tempImage={state.tempImage}
        tempName={state.tempName}
        tempDeckName={state.tempDeckName}
        onBack={() => state.setMode("home")}
        onImageSet={state.setTempImage}
        onImageClear={() => state.setTempImage(null)}
        onNameChange={state.setTempName}
        onDeckNameChange={state.setTempDeckName}
        onAddCard={addManualCard}
      />
    );
  }

  if (state.mode === "roster") {
    return (
      <RosterUploadPage
        decks={state.decks}
        rosterFile={state.rosterFile}
        rosterClassName={state.rosterClassName}
        rosterProcessing={state.rosterProcessing}
        onBack={() => state.setMode("home")}
        onFileSelect={handleRosterFileSelect}
        onClassNameChange={state.setRosterClassName}
        onUpload={handleRosterUpload}
        onFileClear={() => {
          state.setRosterFile(null);
          state.setRosterClassName('');
        }}
      />
    );
  }

  if (state.mode === "practice") {
    return (
      <PracticePage
        deck={getCurrentDeck()}
        currentCardIndex={state.currentCardIndex}
        showingName={state.showingName}
        hideMastered={state.hideMastered}
        sessionStats={state.sessionStats}
        onBack={() => {
          state.setMode("home");
          state.setHideMastered(false);
        }}
        onToggleHideMastered={(value) => {
          state.setHideMastered(value);
          state.setCurrentCardIndex(0);
          state.setShowingName(false);
        }}
        onShuffle={shuffleCards}
        onResetProgress={resetProgress}
        onShowName={() => state.setShowingName(true)}
        onNextCard={nextCard}
        onPrevCard={prevCard}
        onMarkCorrect={markCorrect}
        onMarkIncorrect={markIncorrect}
      />
    );
  }

  return null;
}

export default FlashcardApp;
