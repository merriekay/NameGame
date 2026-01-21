/**
 * Utility functions for calculating deck statistics
 */

/**
 * Calculate statistics for a deck
 */
export function getDeckStats(deck) {
  const totalCards = deck.cards.length;
  const masteredCount = deck.cards.filter(c => (c.progress || 0) >= 3).length;
  const masteredPercent = totalCards > 0 ? Math.round((masteredCount / totalCards) * 100) : 0;
  return { totalCards, masteredCount, masteredPercent };
}

/**
 * Get filtered cards for a deck (optionally hide mastered)
 */
export function getFilteredCards(deck, hideMastered) {
  if (!deck) return [];

  if (hideMastered) {
    return deck.cards.filter(card => (card.progress || 0) < 3);
  }
  return deck.cards;
}
