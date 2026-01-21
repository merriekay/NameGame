import { ChevronLeft, Upload } from "lucide-react";
import { handleImageUpload, handleImagePaste } from "../../utils/imageHandlers";

/**
 * Manual student entry page
 */
function ManualEntryPage({
  decks,
  tempImage,
  tempName,
  tempDeckName,
  onBack,
  onImageSet,
  onImageClear,
  onNameChange,
  onDeckNameChange,
  onAddCard
}) {
  return (
    <div className="min-h-screen bg-editor-bg p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-8 transition-colors px-2 py-1 hover:bg-editor-bg-light rounded"
        >
          <ChevronLeft size={20} />
          Back to Home
        </button>

        <div className="bg-editor-bg-light border border-editor-border rounded-lg p-6 md:p-10 shadow-xl">
          <h2 className="text-3xl font-bold mb-8 text-text-primary">Add Student Manually</h2>

          {/* Deck name input */}
          <div className="mb-8">
            <label className="block text-sm font-semibold mb-3 text-text-primary uppercase tracking-wide">Deck / Class Name</label>
            <input
              type="text"
              value={tempDeckName}
              onChange={(e) => onDeckNameChange(e.target.value)}
              placeholder="e.g., CS178_S1"
              list="existing-decks"
              className="w-full bg-editor-bg border border-editor-border rounded-lg px-5 py-3.5 text-text-primary text-lg placeholder-text-muted focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue focus:ring-opacity-20 transition-all"
            />
            <datalist id="existing-decks">
              {decks.map(deck => (
                <option key={deck._id} value={deck.name} />
              ))}
            </datalist>
            <p className="text-xs text-text-secondary mt-2">Select an existing deck or create a new one</p>
          </div>

          {/* Image upload area */}
          <div
            className="mb-8 border-2 border-dashed border-editor-border rounded-lg p-12 hover:border-accent-blue hover:bg-editor-bg transition-all duration-200 relative min-h-[280px] flex items-center justify-center"
            onPaste={(e) => handleImagePaste(e, onImageSet)}
          >
            {tempImage ? (
              <div className="flex flex-col items-center gap-4">
                <img
                  src={tempImage}
                  alt="Student preview"
                  className="max-w-sm max-h-72 rounded-lg shadow-lg border border-editor-border"
                />
                <button
                  onClick={onImageClear}
                  className="bg-accent-red hover:bg-accent-red-hover text-white px-6 py-2.5 rounded-lg transition-colors font-medium"
                >
                  Remove Image
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <Upload size={56} className="mx-auto mb-5 text-accent-blue" />
                <p className="text-text-primary mb-2 text-lg font-medium">
                  Click to upload or paste (Cmd/Ctrl+V) an image
                </p>
                <p className="text-sm text-text-secondary">
                  Screenshot, photo, or any image file
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files[0], onImageSet)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Name input */}
          <div className="mb-8">
            <label className="block text-sm font-semibold mb-3 text-text-primary uppercase tracking-wide">Student Name</label>
            <input
              type="text"
              value={tempName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="First Last"
              className="w-full bg-editor-bg border border-editor-border rounded-lg px-5 py-3.5 text-text-primary text-lg placeholder-text-muted focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue focus:ring-opacity-20 transition-all"
              onKeyPress={(e) => {
                if (e.key === "Enter" && tempImage && tempName.trim() && tempDeckName.trim()) {
                  onAddCard();
                }
              }}
            />
          </div>

          {/* Add button */}
          <button
            onClick={onAddCard}
            disabled={!tempImage || !tempName.trim() || !tempDeckName.trim()}
            className={`w-full py-4 rounded-lg font-semibold text-lg transition-all duration-200 ${
              !tempImage || !tempName.trim() || !tempDeckName.trim()
                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-accent-blue hover:bg-accent-blue-hover text-white shadow-lg hover:shadow-xl hover:scale-[1.02]"
            }`}
          >
            Add Card
          </button>

          {/* Recently added - show all decks */}
          {decks.length > 0 && (
            <div className="mt-8 pt-8 border-t border-editor-border">
              <h3 className="text-lg font-semibold mb-4 text-text-primary">Your Decks</h3>
              {decks.map(deck => (
                <div key={deck._id} className="mb-4">
                  <h4 className="text-sm font-semibold text-text-secondary mb-2">{deck.name} ({deck.cards.length})</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {deck.cards.slice(-4).reverse().map((card) => (
                      <div key={card._id} className="relative group">
                        <img src={card.image} alt={card.name} className="w-full aspect-[111/147] rounded object-cover" />
                        <p className="text-xs text-text-primary truncate mt-1">{card.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ManualEntryPage;
