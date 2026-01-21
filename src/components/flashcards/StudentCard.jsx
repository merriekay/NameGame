import { Check, Edit2, Save, X } from "lucide-react";

/**
 * Individual student card component
 * Used in deck preview grids
 */
function StudentCard({
  card,
  deckId,
  isEditing,
  editingCardName,
  onEditStart,
  onEditSave,
  onEditCancel,
  onEditNameChange
}) {
  const isMastered = (card.progress || 0) >= 3;

  return (
    <div className="group relative">
      <div
        className="rounded-lg overflow-hidden border border-editor-border"
        style={{aspectRatio: '111/147', position: 'relative', backgroundColor: '#fff'}}
      >
        <img
          src={card.image}
          alt={card.name}
          style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block'}}
        />
        {isMastered && (
          <div className="absolute top-1 right-1 bg-accent-green text-white rounded-full p-1">
            <Check size={12} />
          </div>
        )}
        <button
          onClick={() => onEditStart(card._id, card.name)}
          className="absolute top-1 left-1 bg-accent-blue text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Edit name"
        >
          <Edit2 size={12} />
        </button>
      </div>
      {isEditing ? (
        <div className="flex gap-1 mt-1">
          <input
            type="text"
            value={editingCardName}
            onChange={(e) => onEditNameChange(e.target.value)}
            className="flex-1 text-xs bg-editor-bg border border-accent-blue rounded px-1 py-0.5 text-text-primary"
            autoFocus
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                onEditSave(deckId, card._id, editingCardName);
              }
            }}
          />
          <button
            onClick={() => onEditSave(deckId, card._id, editingCardName)}
            className="text-accent-green hover:text-accent-green-hover"
          >
            <Save size={12} />
          </button>
          <button
            onClick={onEditCancel}
            className="text-accent-red hover:text-accent-red-hover"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <p className="text-xs text-text-primary truncate mt-1">{card.name}</p>
      )}
    </div>
  );
}

export default StudentCard;
