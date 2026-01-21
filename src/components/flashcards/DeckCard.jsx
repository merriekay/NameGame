import StudentCard from "./StudentCard";
import { getDeckStats } from "../../utils/deckStats";

/**
 * Deck display card component
 * Shows deck overview with student preview grid
 */
function DeckCard({
  deck,
  onPractice,
  onDelete,
  editingCardId,
  editingCardName,
  onEditStart,
  onEditSave,
  onEditCancel,
  onEditNameChange
}) {
  const stats = getDeckStats(deck);

  return (
    <div className="bg-editor-bg-light border border-editor-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <h4 className="text-xl font-semibold text-text-primary mb-2">{deck.name}</h4>
          <div className="flex gap-6 text-sm text-text-secondary">
            <span>{stats.totalCards} students</span>
            <span className="text-accent-purple font-semibold">
              {stats.masteredPercent}% mastered ({stats.masteredCount}/{stats.totalCards})
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onPractice(deck._id)}
            className="bg-accent-blue hover:bg-accent-blue-hover text-white px-4 py-2 rounded transition-colors"
          >
            Practice
          </button>
          <button
            onClick={() => onDelete(deck._id)}
            className="bg-accent-red hover:bg-accent-red-hover text-white px-4 py-2 rounded transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {deck.cards.slice(0, 12).map((card) => (
          <StudentCard
            key={card._id}
            card={card}
            deckId={deck._id}
            isEditing={editingCardId === card._id}
            editingCardName={editingCardName}
            onEditStart={onEditStart}
            onEditSave={onEditSave}
            onEditCancel={onEditCancel}
            onEditNameChange={onEditNameChange}
          />
        ))}
        {deck.cards.length > 12 && (
          <div className="flex items-center justify-center text-text-secondary text-sm">
            +{deck.cards.length - 12} more
          </div>
        )}
      </div>
    </div>
  );
}

export default DeckCard;
