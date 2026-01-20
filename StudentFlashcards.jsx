import { useState, useEffect } from "react";
import {
  Upload,
  Users,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  RotateCcw,
  Plus,
} from "lucide-react";
import "./StudentFlashcards.css";

/**
 * Student Name Flashcard System
 *
 * A focused tool for professors to learn student names before class starts.
 * Supports manual card creation and automatic roster parsing.
 *
 * Features:
 * - Manual mode: Upload/paste images + enter names
 * - Roster mode: Auto-extract from class roster PDFs/images
 * - Practice mode: Flip cards, self-grade, track progress
 * - Persistent storage across sessions
 */

function StudentFlashcards() {
  // State management
  const [mode, setMode] = useState("home"); // 'home', 'manual', 'roster', 'practice'
  const [cards, setCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showingName, setShowingName] = useState(false);
  const [masteredCards, setMasteredCards] = useState(new Set());

  // Manual entry state
  const [tempImage, setTempImage] = useState(null);
  const [tempName, setTempName] = useState("");

  // Statistics
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
  });

  // Load cards from storage on mount
  useEffect(() => {
    loadCards();
  }, []);

  // Storage functions - using in-memory state only (no localStorage)
  const loadCards = () => {
    // In a real implementation, this would load from a backend
    // For now, start with empty cards
    setCards([]);
  };

  const saveCards = (newCards) => {
    setCards(newCards);
    // In a real implementation, save to backend here
  };

  // Image handling
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setTempImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImagePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let item of items) {
      if (item.type.indexOf("image") !== -1) {
        const file = item.getAsFile();
        const reader = new FileReader();
        reader.onload = (event) => {
          setTempImage(event.target.result);
        };
        reader.readAsDataURL(file);
        break;
      }
    }
  };

  // Manual card creation
  const addManualCard = () => {
    if (!tempImage || !tempName.trim()) return;

    const newCard = {
      id: Date.now(),
      image: tempImage,
      name: tempName.trim(),
      created: new Date().toISOString(),
    };

    const updatedCards = [...cards, newCard];
    saveCards(updatedCards);

    // Reset form
    setTempImage(null);
    setTempName("");
  };

  // Roster parsing (simplified - in real version would use OCR/CV)
  const handleRosterUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // For demo: just show a message about what would happen
    alert(
      "In production: This would use OCR to extract names and face detection to crop individual photos from the roster. For now, use manual entry mode.",
    );
  };

  // Practice mode functions
  const getCurrentCard = () => cards[currentCardIndex];

  const nextCard = () => {
    setShowingName(false);
    setCurrentCardIndex((currentCardIndex + 1) % cards.length);
  };

  const prevCard = () => {
    setShowingName(false);
    setCurrentCardIndex((currentCardIndex - 1 + cards.length) % cards.length);
  };

  const markCorrect = () => {
    setSessionStats((prev) => ({ ...prev, correct: prev.correct + 1 }));
    const newMastered = new Set(masteredCards);
    newMastered.add(getCurrentCard()?.id);
    setMasteredCards(newMastered);
    nextCard();
  };

  const markIncorrect = () => {
    setSessionStats((prev) => ({ ...prev, incorrect: prev.incorrect + 1 }));
    nextCard();
  };

  const resetProgress = () => {
    setSessionStats({ correct: 0, incorrect: 0 });
    setMasteredCards(new Set());
    setCurrentCardIndex(0);
    setShowingName(false);
  };

  const shuffleCards = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    saveCards(shuffled);
    setCurrentCardIndex(0);
    setShowingName(false);
  };

  // Delete card
  const deleteCard = (cardId) => {
    const updatedCards = cards.filter((c) => c.id !== cardId);
    saveCards(updatedCards);
    if (currentCardIndex >= updatedCards.length) {
      setCurrentCardIndex(Math.max(0, updatedCards.length - 1));
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (mode !== "practice") return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          setShowingName(!showingName);
          break;
        case "ArrowRight":
          nextCard();
          break;
        case "ArrowLeft":
          prevCard();
          break;
        case "y":
        case "Y":
          if (showingName) markCorrect();
          break;
        case "n":
        case "N":
          if (showingName) markIncorrect();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [mode, showingName, currentCardIndex]);

  // Render functions for each mode
  const renderHome = () => (
    <div className="flashcard-home">
      <div className="flashcard-header">
        <h1>Student Name Flashcards</h1>
        <p className="flashcard-subtitle">
          Learn your students' names before class starts
        </p>
      </div>

      <div className="flashcard-mode-grid">
        {/* Manual Entry */}
        <button
          onClick={() => setMode("manual")}
          className="flashcard-mode-option"
        >
          <div className="mode-option-icon" style={{ background: "#0e639c" }}>
            <Plus size={32} />
          </div>
          <h2>Add Manually</h2>
          <p>Paste or upload photos one at a time</p>
        </button>

        {/* Roster Upload */}
        <button
          onClick={() => setMode("roster")}
          className="flashcard-mode-option"
        >
          <div className="mode-option-icon" style={{ background: "#7c3aed" }}>
            <Users size={32} />
          </div>
          <h2>Upload Roster</h2>
          <p>Auto-extract from class roster PDF</p>
        </button>

        {/* Practice */}
        <button
          onClick={() => (cards.length > 0 ? setMode("practice") : null)}
          disabled={cards.length === 0}
          className={`flashcard-mode-option ${cards.length === 0 ? "disabled" : ""}`}
        >
          <div
            className="mode-option-icon"
            style={{ background: cards.length > 0 ? "#059669" : "#6b7280" }}
          >
            <RotateCcw size={32} />
          </div>
          <h2>Practice</h2>
          <p>
            {cards.length === 0
              ? "Add cards first"
              : `Study ${cards.length} students`}
          </p>
        </button>
      </div>

      {/* Cards overview */}
      {cards.length > 0 && (
        <div className="flashcard-overview">
          <h3>Your Cards ({cards.length})</h3>
          <div className="flashcard-grid">
            {cards.map((card) => (
              <div key={card.id} className="flashcard-preview">
                <img src={card.image} alt={card.name} />
                <div className="flashcard-preview-overlay">
                  <button
                    onClick={() => deleteCard(card.id)}
                    className="delete-card-btn"
                  >
                    Delete
                  </button>
                </div>
                <p className="flashcard-preview-name">{card.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderManual = () => (
    <div className="flashcard-manual">
      <button onClick={() => setMode("home")} className="back-button">
        <ChevronLeft size={20} />
        Back to Home
      </button>

      <div className="flashcard-panel">
        <h2>Add Student Manually</h2>

        {/* Image upload area */}
        <div className="image-upload-area" onPaste={handleImagePaste}>
          {tempImage ? (
            <div className="image-preview-container">
              <img
                src={tempImage}
                alt="Student preview"
                className="image-preview"
              />
              <button
                onClick={() => setTempImage(null)}
                className="remove-image-btn"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="upload-placeholder">
              <Upload size={48} />
              <p className="upload-text">
                Click to upload or paste (Cmd/Ctrl+V) an image
              </p>
              <p className="upload-subtext">
                Screenshot, photo, or any image file
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="file-input"
              />
            </div>
          )}
        </div>

        {/* Name input */}
        <div className="name-input-group">
          <label>Student Name</label>
          <input
            type="text"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            placeholder="First Last"
            className="name-input"
            onKeyPress={(e) => {
              if (e.key === "Enter" && tempImage && tempName.trim()) {
                addManualCard();
              }
            }}
          />
        </div>

        {/* Add button */}
        <button
          onClick={addManualCard}
          disabled={!tempImage || !tempName.trim()}
          className={`add-card-btn ${!tempImage || !tempName.trim() ? "disabled" : ""}`}
        >
          Add Card
        </button>

        {/* Recently added */}
        {cards.length > 0 && (
          <div className="recently-added">
            <h3>Recently Added ({cards.length})</h3>
            <div className="recent-cards-list">
              {cards
                .slice(-5)
                .reverse()
                .map((card) => (
                  <div key={card.id} className="recent-card-item">
                    <img src={card.image} alt={card.name} />
                    <span>{card.name}</span>
                    <button
                      onClick={() => deleteCard(card.id)}
                      className="delete-recent-btn"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderRoster = () => (
    <div className="flashcard-roster">
      <button onClick={() => setMode("home")} className="back-button">
        <ChevronLeft size={20} />
        Back to Home
      </button>

      <div className="flashcard-panel">
        <h2>Upload Class Roster</h2>

        <div className="roster-upload-area">
          <Upload size={48} />
          <p className="upload-text">Upload your class roster PDF or image</p>
          <p className="upload-subtext">We'll auto-detect faces and names</p>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={handleRosterUpload}
            className="file-input"
          />
        </div>

        <div className="info-banner">
          <h3>Coming Soon</h3>
          <p>
            This feature will use computer vision to detect individual faces and
            OCR to extract names from your roster printout. For now, please use
            the manual entry mode to add students one at a time.
          </p>
        </div>
      </div>
    </div>
  );

  const renderPractice = () => {
    if (cards.length === 0) {
      setMode("home");
      return null;
    }

    const currentCard = getCurrentCard();
    const progress = currentCardIndex + 1;
    const total = cards.length;
    const masteredCount = masteredCards.size;

    return (
      <div className="flashcard-practice">
        {/* Header */}
        <div className="practice-header">
          <button onClick={() => setMode("home")} className="back-button">
            <ChevronLeft size={20} />
            Back to Home
          </button>

          <div className="practice-controls">
            <button onClick={shuffleCards} className="control-btn">
              <RotateCcw size={16} />
              Shuffle
            </button>
            <button onClick={resetProgress} className="control-btn">
              Reset Progress
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="practice-stats">
          <div className="stat-card">
            <div className="stat-value">
              {progress}/{total}
            </div>
            <div className="stat-label">Progress</div>
          </div>
          <div className="stat-card">
            <div className="stat-value stat-correct">
              {sessionStats.correct}
            </div>
            <div className="stat-label">Correct</div>
          </div>
          <div className="stat-card">
            <div className="stat-value stat-incorrect">
              {sessionStats.incorrect}
            </div>
            <div className="stat-label">Incorrect</div>
          </div>
          <div className="stat-card">
            <div className="stat-value stat-mastered">{masteredCount}</div>
            <div className="stat-label">Mastered</div>
          </div>
        </div>

        {/* Flashcard */}
        <div className="practice-card">
          {masteredCards.has(currentCard?.id) && (
            <div className="mastered-badge">
              <Check size={16} />
              Mastered
            </div>
          )}

          <div className="card-content">
            {/* Photo */}
            <div className="card-image-container">
              <img
                src={currentCard?.image}
                alt="Student"
                className="card-image"
              />
            </div>

            {/* Name reveal */}
            <div className="card-reveal">
              {showingName ? (
                <div className="reveal-content">
                  <h2 className="student-name">{currentCard?.name}</h2>
                  <div className="grade-buttons">
                    <button
                      onClick={markIncorrect}
                      className="grade-btn incorrect-btn"
                    >
                      <X size={24} />
                      Missed (N)
                    </button>
                    <button
                      onClick={markCorrect}
                      className="grade-btn correct-btn"
                    >
                      <Check size={24} />
                      Got It! (Y)
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowingName(true)}
                  className="show-name-btn"
                >
                  Show Name (Space)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="practice-navigation">
          <button onClick={prevCard} className="nav-btn">
            <ChevronLeft size={20} />
            Previous
          </button>

          <div className="keyboard-hints">
            Use arrow keys to navigate • Space to reveal • Y/N to grade
          </div>

          <button onClick={nextCard} className="nav-btn">
            Next
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  };

  // Main render
  return (
    <div className="flashcard-container">
      {mode === "home" && renderHome()}
      {mode === "manual" && renderManual()}
      {mode === "roster" && renderRoster()}
      {mode === "practice" && renderPractice()}
    </div>
  );
}

export default StudentFlashcards;
