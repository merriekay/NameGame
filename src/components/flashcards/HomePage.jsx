import { Upload, Users, RotateCcw, Plus } from "lucide-react";
import DeckCard from "./DeckCard";

/**
 * Home page - main menu with deck overview
 */
function HomePage({
  user,
  onLogout,
  decks,
  onNavigate,
  editingCardId,
  editingCardName,
  onEditStart,
  onEditSave,
  onEditCancel,
  onEditNameChange,
  onPracticeDeck,
  onDeleteDeck,
}) {
  return (
    <div className="min-h-screen bg-editor-bg p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex-1"></div>
            <h1 className="text-4xl font-bold text-text-primary flex-1">
              Recall: The Name Game
            </h1>
            <div className="flex-1 flex justify-end">
              <button
                onClick={onLogout}
                className="text-text-secondary hover:text-text-primary transition-colors text-sm"
              >
                Logout ({user?.name})
              </button>
            </div>
          </div>
          <p className="text-lg text-text-secondary">
            Learn your students' names before class starts
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Manual Entry */}
          <button
            onClick={() => onNavigate("manual")}
            className="bg-editor-bg-light border-2 border-editor-border rounded-2xl p-8 hover:bg-editor-bg-lighter hover:border-accent-green transition-all duration-200 text-left group shadow-lg hover:shadow-xl"
          >
            <div className="w-20 h-20 bg-accent-green rounded-2xl flex items-center justify-center mb-6 group-hover:bg-accent-green-hover transition-colors shadow-lg">
              <Plus size={36} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-text-primary">
              Add Manually
            </h2>
            <p className="text-text-secondary text-base">
              Paste or upload photos one at a time
            </p>
          </button>

          {/* Roster Upload */}
          <button
            onClick={() => onNavigate("roster")}
            className="bg-editor-bg-light border-2 border-editor-border rounded-2xl p-8 hover:bg-editor-bg-lighter hover:border-accent-purple transition-all duration-200 text-left group shadow-lg hover:shadow-xl"
          >
            <div className="w-20 h-20 bg-accent-purple rounded-2xl flex items-center justify-center mb-6 group-hover:bg-accent-purple-hover transition-colors shadow-lg">
              <Users size={36} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-text-primary">
              Upload Roster
            </h2>
            <p className="text-text-secondary text-base">
              Auto-extract from class roster PDF... (it's about 90% accuate)
            </p>
          </button>

          {/* Practice */}
          <button
            onClick={() => (decks.length > 0 ? onNavigate("deckSelect") : null)}
            disabled={decks.length === 0}
            className={`bg-editor-bg-light border-2 border-editor-border rounded-2xl p-8 transition-all duration-200 text-left group shadow-lg ${
              decks.length === 0
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-editor-bg-lighter hover:border-accent-blue hover:shadow-xl"
            }`}
          >
            <div
              className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-colors shadow-lg ${
                decks.length > 0
                  ? "bg-accent-blue group-hover:bg-accent-blue-hover"
                  : "bg-gray-600"
              }`}
            >
              <RotateCcw size={36} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-text-primary">
              Practice
            </h2>
            <p className="text-text-secondary text-base">
              {decks.length === 0
                ? "Add cards first"
                : `${decks.length} deck${decks.length !== 1 ? "s" : ""} available`}
            </p>
          </button>
        </div>

        {/* Decks overview */}
        {decks.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold text-text-primary">
              Your Decks
            </h3>
            {decks.map((deck) => (
              <DeckCard
                key={deck._id}
                deck={deck}
                onPractice={onPracticeDeck}
                onDelete={onDeleteDeck}
                editingCardId={editingCardId}
                editingCardName={editingCardName}
                onEditStart={onEditStart}
                onEditSave={onEditSave}
                onEditCancel={onEditCancel}
                onEditNameChange={onEditNameChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;
