import { ChevronLeft, ChevronRight, Check, X, RotateCcw } from "lucide-react";
import { getDeckStats, getFilteredCards } from "../../utils/deckStats";

/**
 * Practice mode page - flashcard interface
 */
function PracticePage({
  deck,
  currentCardIndex,
  showingName,
  hideMastered,
  sessionStats,
  onBack,
  onToggleHideMastered,
  onShuffle,
  onResetProgress,
  onShowName,
  onNextCard,
  onPrevCard,
  onMarkCorrect,
  onMarkIncorrect
}) {
  if (!deck) {
    return null;
  }

  const cards = getFilteredCards(deck, hideMastered);

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-editor-bg p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-8"
          >
            <ChevronLeft size={20} />
            Back to Home
          </button>
          <div className="bg-editor-bg-light border border-editor-border rounded-lg p-12 text-center">
            <h2 className="text-2xl font-bold text-text-primary mb-4">All students mastered! 🎉</h2>
            <p className="text-text-secondary mb-6">You've mastered all students in this deck. Great job!</p>
            <button
              onClick={() => onToggleHideMastered(false)}
              className="bg-accent-blue hover:bg-accent-blue-hover text-white px-6 py-3 rounded-lg transition-colors"
            >
              Show All Students
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentCardIndex];
  const progress = currentCardIndex + 1;
  const total = cards.length;
  const stats = getDeckStats(deck);

  return (
    <div className="min-h-screen bg-editor-bg p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <ChevronLeft size={20} />
            Back to Home
          </button>

          <div className="flex gap-3">
            <button
              onClick={() => onToggleHideMastered(!hideMastered)}
              className={`flex items-center gap-2 border px-4 py-2 rounded transition-colors ${
                hideMastered
                  ? 'bg-accent-purple border-accent-purple text-white'
                  : 'bg-editor-bg-light border-editor-border text-text-primary hover:bg-editor-bg-lighter'
              }`}
            >
              {hideMastered ? <Check size={16} /> : <X size={16} />}
              Hide Mastered
            </button>
            <button
              onClick={onShuffle}
              className="flex items-center gap-2 bg-editor-bg-light border border-editor-border hover:bg-editor-bg-lighter px-4 py-2 rounded transition-colors text-text-primary"
            >
              <RotateCcw size={16} />
              Shuffle
            </button>
            <button
              onClick={onResetProgress}
              className="bg-editor-bg-light border border-editor-border hover:bg-editor-bg-lighter px-4 py-2 rounded transition-colors text-text-primary"
            >
              Reset Progress
            </button>
          </div>
        </div>

        {/* Deck name and stats */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-text-primary mb-2">{deck.name}</h2>
          <p className="text-text-secondary">
            {stats.masteredPercent}% mastered ({stats.masteredCount}/{stats.totalCards})
            {hideMastered && ` • Showing ${total} unmastered`}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-editor-bg-light border border-editor-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-text-primary">
              {progress}/{total}
            </div>
            <div className="text-sm text-text-secondary">Progress</div>
          </div>
          <div className="bg-editor-bg-light border border-editor-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-accent-green">
              {sessionStats.correct}
            </div>
            <div className="text-sm text-text-secondary">Correct</div>
          </div>
          <div className="bg-editor-bg-light border border-editor-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-accent-red">
              {sessionStats.incorrect}
            </div>
            <div className="text-sm text-text-secondary">Incorrect</div>
          </div>
          <div className="bg-editor-bg-light border border-editor-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-accent-purple">{stats.masteredCount}</div>
            <div className="text-sm text-text-secondary">Mastered</div>
          </div>
        </div>

        {/* Flashcard */}
        <div className="bg-editor-bg-light border border-editor-border rounded-lg p-8 mb-6 relative">
          {currentCard && (currentCard.progress || 0) >= 3 && (
            <div className="absolute top-4 right-4 bg-accent-green text-white px-3 py-1 rounded-full flex items-center gap-2 text-sm">
              <Check size={16} />
              Mastered
            </div>
          )}
          {currentCard && (currentCard.progress || 0) > 0 && (currentCard.progress || 0) < 3 && (
            <div className="absolute top-4 right-4 bg-accent-blue text-white px-3 py-1 rounded-full text-sm">
              {currentCard.progress}/3
            </div>
          )}

          <div className="flex flex-col items-center">
            {/* Photo */}
            <div className="w-64 h-64 mb-6 rounded-lg overflow-hidden bg-editor-bg-lighter border border-editor-border">
              <img
                src={currentCard?.image}
                alt="Student"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Name reveal */}
            <div className="w-full text-center">
              {showingName ? (
                <div>
                  <h2 className="text-3xl font-bold mb-6 text-text-primary">{currentCard?.name}</h2>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={onMarkIncorrect}
                      className="flex items-center gap-2 bg-accent-red hover:bg-accent-red-hover text-white px-6 py-3 rounded-lg transition-colors"
                    >
                      <X size={24} />
                      Missed (N)
                    </button>
                    <button
                      onClick={onMarkCorrect}
                      className="flex items-center gap-2 bg-accent-green hover:bg-accent-green-hover text-white px-6 py-3 rounded-lg transition-colors"
                    >
                      <Check size={24} />
                      Got It! (Y)
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={onShowName}
                  className="bg-accent-blue hover:bg-accent-blue-hover text-white px-8 py-3 rounded-lg transition-colors font-medium"
                >
                  Show Name (Space)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={onPrevCard}
            className="flex items-center gap-2 bg-editor-bg-light border border-editor-border hover:bg-editor-bg-lighter px-4 py-2 rounded transition-colors text-text-primary"
          >
            <ChevronLeft size={20} />
            Previous
          </button>

          <div className="text-sm text-text-secondary">
            Use arrow keys to navigate • Space to reveal • Y/N to grade
          </div>

          <button
            onClick={onNextCard}
            className="flex items-center gap-2 bg-editor-bg-light border border-editor-border hover:bg-editor-bg-lighter px-4 py-2 rounded transition-colors text-text-primary"
          >
            Next
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default PracticePage;
