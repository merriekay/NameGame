import { useCallback } from 'react';
import { decksAPI } from '../services/api';

/**
 * Custom hook for deck API operations
 * Consolidates all deck-related API calls with error handling
 */
export function useDecks(state) {
  const { setDecks, setLoading, setError, decks } = state;

  const loadDecks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await decksAPI.getAll();
      setDecks(data);
    } catch (err) {
      console.error('Error loading decks:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [setDecks, setLoading, setError]);

  const createDeck = useCallback(async (name, cards = []) => {
    try {
      const newDeck = await decksAPI.create(name, cards);
      setDecks([...decks, newDeck]);
      return newDeck;
    } catch (err) {
      console.error('Error creating deck:', err);
      setError(err.message);
      throw err;
    }
  }, [decks, setDecks, setError]);

  const updateDeck = useCallback(async (deckId, updates) => {
    try {
      const updatedDeck = await decksAPI.update(deckId, updates);
      setDecks(decks.map(d => d._id === deckId ? updatedDeck : d));
      return updatedDeck;
    } catch (err) {
      console.error('Error updating deck:', err);
      setError(err.message);
      throw err;
    }
  }, [decks, setDecks, setError]);

  const deleteDeck = useCallback(async (deckId) => {
    try {
      await decksAPI.delete(deckId);
      await loadDecks();
    } catch (err) {
      console.error('Error deleting deck:', err);
      alert('Error deleting deck: ' + err.message);
    }
  }, [loadDecks]);

  const deleteCard = useCallback(async (deckId, cardId) => {
    try {
      await decksAPI.deleteCard(deckId, cardId);
      await loadDecks();
    } catch (err) {
      console.error('Error deleting card:', err);
      alert('Error deleting card: ' + err.message);
    }
  }, [loadDecks]);

  const updateCardProgress = useCallback(async (deckId, cardId, progress) => {
    try {
      await decksAPI.updateCardProgress(deckId, cardId, progress);
      await loadDecks();
    } catch (err) {
      console.error('Error updating progress:', err);
      throw err;
    }
  }, [loadDecks]);

  const addCardToDeck = useCallback(async (deckId, name, image) => {
    try {
      await decksAPI.addCard(deckId, name, image);
      await loadDecks();
    } catch (err) {
      console.error('Error adding card:', err);
      throw err;
    }
  }, [loadDecks]);

  return {
    loadDecks,
    createDeck,
    updateDeck,
    deleteDeck,
    deleteCard,
    updateCardProgress,
    addCardToDeck,
  };
}
