import { useState } from 'react';

/**
 * Custom hook to manage all flashcard application state
 * Consolidates 15+ useState calls from the original component
 */
export function useFlashcardState() {
  // Mode state
  const [mode, setMode] = useState("home"); // 'home', 'manual', 'roster', 'practice', 'deckSelect'

  // Deck and card state
  const [decks, setDecks] = useState([]);
  const [currentDeckId, setCurrentDeckId] = useState(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // Practice mode state
  const [showingName, setShowingName] = useState(false);
  const [hideMastered, setHideMastered] = useState(false);

  // Loading and error state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Manual entry state
  const [tempImage, setTempImage] = useState(null);
  const [tempName, setTempName] = useState("");
  const [tempDeckName, setTempDeckName] = useState("");

  // Edit mode state
  const [editingCardId, setEditingCardId] = useState(null);
  const [editingCardName, setEditingCardName] = useState("");

  // Roster parsing state
  const [rosterProcessing, setRosterProcessing] = useState(false);
  const [rosterPreview, setRosterPreview] = useState(null);
  const [rosterClassName, setRosterClassName] = useState('');
  const [rosterFile, setRosterFile] = useState(null);

  // Statistics
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
  });

  return {
    // Mode
    mode,
    setMode,

    // Decks
    decks,
    setDecks,
    currentDeckId,
    setCurrentDeckId,
    currentCardIndex,
    setCurrentCardIndex,

    // Practice
    showingName,
    setShowingName,
    hideMastered,
    setHideMastered,

    // Loading/Error
    loading,
    setLoading,
    error,
    setError,

    // Manual entry
    tempImage,
    setTempImage,
    tempName,
    setTempName,
    tempDeckName,
    setTempDeckName,

    // Edit mode
    editingCardId,
    setEditingCardId,
    editingCardName,
    setEditingCardName,

    // Roster
    rosterProcessing,
    setRosterProcessing,
    rosterPreview,
    setRosterPreview,
    rosterClassName,
    setRosterClassName,
    rosterFile,
    setRosterFile,

    // Stats
    sessionStats,
    setSessionStats,
  };
}
