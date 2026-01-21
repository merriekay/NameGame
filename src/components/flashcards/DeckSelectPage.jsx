import { ChevronLeft, ChevronRight } from "lucide-react";
import { getDeckStats } from "../../utils/deckStats";

/**
 * Deck selection page for practice mode
 */
function DeckSelectPage({ decks, onBack, onSelectDeck }) {
  return (
    <div className="min-h-screen bg-editor-bg p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-8 transition-colors"
        >
          <ChevronLeft size={20} />
          Back to Home
        </button>

        <h2 className="text-3xl font-bold mb-8 text-text-primary">Select a Deck to Practice</h2>

        <div className="space-y-4">
          {decks.map((deck) => {
            const stats = getDeckStats(deck);
            return (
              <button
                key={deck._id}
                onClick={() => onSelectDeck(deck._id)}
                className="w-full bg-editor-bg-light border-2 border-editor-border rounded-lg p-6 hover:bg-editor-bg-lighter hover:border-accent-blue transition-all text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-text-primary mb-2">{deck.name}</h3>
                    <div className="flex gap-6 text-sm text-text-secondary">
                      <span>{stats.totalCards} students</span>
                      <span className="text-accent-purple font-semibold">
                        {stats.masteredPercent}% mastered
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={24} className="text-text-secondary" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default DeckSelectPage;
