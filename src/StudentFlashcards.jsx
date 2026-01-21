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
  Edit2,
  Save,
} from "lucide-react";
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { decksAPI } from './services/api';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

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

function StudentFlashcards({ user, onLogout }) {
  // State management
  const [mode, setMode] = useState("home"); // 'home', 'manual', 'roster', 'practice', 'deckSelect'
  const [decks, setDecks] = useState([]); // Array of {id, name, cards}
  const [currentDeckId, setCurrentDeckId] = useState(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showingName, setShowingName] = useState(false);
  const [hideMastered, setHideMastered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Manual entry state
  const [tempImage, setTempImage] = useState(null);
  const [tempName, setTempName] = useState("");
  const [tempDeckName, setTempDeckName] = useState("");

  // Edit mode state
  const [editingCardId, setEditingCardId] = useState(null);
  const [editingCardName, setEditingCardName] = useState("");

  // Statistics
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    incorrect: 0,
  });

  // Load decks from API on mount
  useEffect(() => {
    loadDecks();
  }, []);

  // Helper functions
  const getCurrentDeck = () => decks.find(d => d._id === currentDeckId);
  const getCurrentDeckCards = () => {
    const deck = getCurrentDeck();
    if (!deck) return [];

    if (hideMastered) {
      return deck.cards.filter(card => (card.progress || 0) < 3);
    }
    return deck.cards;
  };

  // API functions
  const loadDecks = async () => {
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
  };

  const createDeck = async (name, cards = []) => {
    try {
      const newDeck = await decksAPI.create(name, cards);
      setDecks([...decks, newDeck]);
      return newDeck;
    } catch (err) {
      console.error('Error creating deck:', err);
      setError(err.message);
      throw err;
    }
  };

  const updateDeck = async (deckId, updates) => {
    try {
      const updatedDeck = await decksAPI.update(deckId, updates);
      setDecks(decks.map(d => d._id === deckId ? updatedDeck : d));
      return updatedDeck;
    } catch (err) {
      console.error('Error updating deck:', err);
      setError(err.message);
      throw err;
    }
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
  const addManualCard = async () => {
    if (!tempImage || !tempName.trim() || !tempDeckName.trim()) return;

    try {
      // Find or create deck
      let deck = decks.find(d => d.name === tempDeckName.trim());

      if (deck) {
        // Add to existing deck
        await decksAPI.addCard(deck._id, tempName.trim(), tempImage);
        await loadDecks(); // Reload to get updated deck
      } else {
        // Create new deck with this card
        await createDeck(tempDeckName.trim(), [{
          name: tempName.trim(),
          image: tempImage,
          progress: 0
        }]);
      }

      // Reset form
      setTempImage(null);
      setTempName("");
    } catch (err) {
      alert('Error adding card: ' + err.message);
    }
  };

  // Roster parsing state
  const [rosterProcessing, setRosterProcessing] = useState(false);
  const [rosterPreview, setRosterPreview] = useState(null);
  const [rosterClassName, setRosterClassName] = useState('');
  const [rosterFile, setRosterFile] = useState(null);

  // Roster parsing
  const handleRosterFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setRosterFile(file);

    // Auto-suggest class name from filename
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
    setRosterClassName(nameWithoutExt.trim() || '');
  };

  const handleRosterUpload = async () => {
    if (!rosterFile || !rosterClassName.trim()) {
      alert('Please select a file and enter a class name');
      return;
    }

    setRosterProcessing(true);

    try {
      if (rosterFile.type === 'application/pdf') {
        // Convert PDF to images and process
        await processPDFRoster(rosterFile, rosterClassName.trim());
      } else {
        // Process image roster
        await processImageRoster(rosterFile, rosterClassName.trim());
      }

      // Reset form
      setRosterFile(null);
      setRosterClassName('');
    } catch (error) {
      console.error('Error processing roster:', error);
      alert('Error processing roster. Please try manual entry or a different file format.');
    } finally {
      setRosterProcessing(false);
    }
  };

  const processPDFRoster = async (file, className) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      const allStudents = [];

      // Process each page of the PDF
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);

        // Get text content to extract student names
        const textContent = await page.getTextContent();

        // Render page to canvas to extract images
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Render the PDF page to canvas
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        await page.render(renderContext).promise;

        // Debug coordinate tool disabled - we have the correct measurements now
        if (false && pageNum === 1) {
          const debugCanvas = document.createElement('canvas');
          debugCanvas.width = canvas.width;
          debugCanvas.height = canvas.height;
          const debugCtx = debugCanvas.getContext('2d');

          // Draw the PDF page
          debugCtx.drawImage(canvas, 0, 0);

          // Draw grid lines every 100px for measurement
          debugCtx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
          debugCtx.lineWidth = 1;
          for (let x = 0; x < canvas.width; x += 100) {
            debugCtx.beginPath();
            debugCtx.moveTo(x, 0);
            debugCtx.lineTo(x, canvas.height);
            debugCtx.stroke();
            debugCtx.fillStyle = 'red';
            debugCtx.fillText(x.toString(), x + 2, 15);
          }
          for (let y = 0; y < canvas.height; y += 100) {
            debugCtx.beginPath();
            debugCtx.moveTo(0, y);
            debugCtx.lineTo(canvas.width, y);
            debugCtx.stroke();
            debugCtx.fillStyle = 'red';
            debugCtx.fillText(y.toString(), 2, y + 12);
          }

          const gridDebugUrl = debugCanvas.toDataURL('image/jpeg', 0.8);
          const debugWindow = window.open('', 'PDF_Debug');

          const htmlContent = '<html><head><title>PDF Debug</title><style>' +
            'body{margin:0;padding:20px;background:#333;color:#fff;font-family:monospace}' +
            '#canvas{border:2px solid #fff;display:block;cursor:crosshair}' +
            '#info{background:#000;padding:10px;margin-bottom:10px}' +
            '.coords{color:#0f0}' +
            'button{padding:10px;margin:5px;font-size:14px;cursor:pointer}' +
            '</style></head><body>' +
            '<h2>Draw boxes around first 2-3 student photos</h2>' +
            '<div id="info">' +
            '<p>Scale: ' + viewport.scale + 'x | Canvas: ' + canvas.width + 'x' + canvas.height + '</p>' +
            '<p style="color:#ff6">Click and drag to draw boxes. Values logged to console.</p>' +
            '<p class="coords" id="current">Hover to see coordinates</p>' +
            '<button onclick="clearBoxes()">Clear Boxes</button>' +
            '<button onclick="finishMeasuring()">Done - Use These Coordinates</button>' +
            '</div>' +
            '<canvas id="canvas" width="' + canvas.width + '" height="' + canvas.height + '"></canvas>' +
            '<script>' +
            'const canvas=document.getElementById("canvas");' +
            'const ctx=canvas.getContext("2d");' +
            'const scale=' + viewport.scale + ';' +
            'const img=new Image();' +
            'const boxes=[];' +
            'let isDrawing=false,startX,startY;' +
            'img.onload=function(){redraw()};' +
            'img.src="' + gridDebugUrl + '";' +
            'function redraw(){ctx.drawImage(img,0,0);boxes.forEach((b,i)=>{ctx.strokeStyle="#0f0";ctx.lineWidth=3;ctx.strokeRect(b.x,b.y,b.w,b.h);ctx.fillStyle="#0f0";ctx.font="16px monospace";ctx.fillText("Photo "+(i+1),b.x+5,b.y+20)})}' +
            'canvas.addEventListener("mousedown",e=>{const r=canvas.getBoundingClientRect();startX=e.clientX-r.left;startY=e.clientY-r.top;isDrawing=true});' +
            'canvas.addEventListener("mousemove",e=>{const r=canvas.getBoundingClientRect();const x=e.clientX-r.left,y=e.clientY-r.top;' +
            'document.getElementById("current").textContent="Pixel: ("+Math.round(x)+", "+Math.round(y)+") | PDF points: ("+Math.round(x/scale)+", "+Math.round(y/scale)+")";' +
            'if(isDrawing){redraw();ctx.strokeStyle="#ff0";ctx.lineWidth=2;ctx.strokeRect(startX,startY,x-startX,y-startY)}});' +
            'canvas.addEventListener("mouseup",e=>{if(!isDrawing)return;const r=canvas.getBoundingClientRect();const endX=e.clientX-r.left,endY=e.clientY-r.top,w=endX-startX,h=endY-startY;' +
            'boxes.push({x:startX,y:startY,w:w,h:h});' +
            'console.log("Box "+boxes.length+" drawn:");' +
            'console.log("  Pixels: x="+Math.round(startX)+", y="+Math.round(startY)+", w="+Math.round(w)+", h="+Math.round(h));' +
            'console.log("  PDF Points: x="+Math.round(startX/scale)+", y="+Math.round(startY/scale)+", w="+Math.round(w/scale)+", h="+Math.round(h/scale));' +
            'redraw();isDrawing=false});' +
            'function clearBoxes(){boxes.length=0;redraw();console.clear()}' +
            'function finishMeasuring(){if(boxes.length===0){alert("Draw at least 2 photo boxes first!");return}' +
            'console.log("\\n=== FINAL MEASUREMENTS ===");console.log("Boxes: "+boxes.length);' +
            'boxes.forEach((b,i)=>{console.log("Photo "+(i+1)+" (PDF points):");' +
            'console.log("  x: "+Math.round(b.x/scale)+", y: "+Math.round(b.y/scale)+", width: "+Math.round(b.w/scale)+", height: "+Math.round(b.h/scale))});' +
            'if(boxes.length>=2){const s=Math.round((boxes[1].y-boxes[0].y)/scale);console.log("Vertical spacing: "+s+" PDF points")}' +
            'alert("Measurements logged to console! Copy values and paste in chat.")}' +
            '</script></body></html>';

          debugWindow.document.write(htmlContent);
        }

        // Parse student entries from this page
        const students = await parseStudentsFromPage(textContent, canvas, viewport);
        allStudents.push(...students);
      }

      // Prepare cards for API
      const newCards = allStudents.map(student => ({
        image: student.image,
        name: student.name,
        progress: 0
      }));

      // Create or update deck via API
      const existingDeck = decks.find(d => d.name === className);
      if (existingDeck) {
        // Add cards to existing deck
        const updatedCards = [...existingDeck.cards, ...newCards];
        await updateDeck(existingDeck._id, { cards: updatedCards });
      } else {
        // Create new deck
        await createDeck(className, newCards);
      }

      setMode('home');
      alert(`Successfully imported ${newCards.length} students to deck "${className}"!`);

    } catch (error) {
      console.error('Error processing PDF:', error);
      alert('Error processing PDF. Please make sure it\'s a valid Drake roster PDF.');
    }
  };

  const parseStudentsFromPage = async (textContent, canvas, viewport) => {
    const students = [];

    // Get all text items with their positions
    const textItems = textContent.items;

    // Build full text for parsing
    const fullText = textItems.map(item => item.str).join(' ');

    // Extract all names - looking for "Name: LastName, FirstName"
    // Names can have hyphens, apostrophes, spaces
    const nameMatches = Array.from(fullText.matchAll(/Name:\s*([A-Za-z\-']+),\s*([A-Za-z\s]+?)(?=\s+Pronouns)/g));

    const names = nameMatches.map(match => {
      const lastName = match[1].trim();
      const firstName = match[2].trim();
      const fullName = `${firstName} ${lastName}`;
      return fullName;
    });

    if (names.length === 0) {
      console.warn('No names found on this page');
      return students;
    }

    // Drake roster layout with EXACT measured coordinates from PDF:
    // Measured using interactive tool - these are precise PDF points
    // Photo 1: x=25, y=78, width=110, height=148
    // Photo 2: x=23, y=241, width=111, height=146
    // Photo 3: x=24, y=403, width=111, height=147
    // Photo 4: x=24, y=566, width=133, height=148
    // Vertical spacing: 163 PDF points

    const scale = viewport.scale; // Viewport scale (2.0)

    // Average measurements from the 4 photos in PDF points
    const pdfPhotoX = 24;        // Average x position
    const pdfPhotoY = 78;        // First photo Y position
    const pdfPhotoWidth = 111;   // Average width
    const pdfPhotoHeight = 147;  // Average height
    const pdfPhotoSpacing = 163; // Measured vertical spacing

    // Convert to canvas coordinates using viewport scale
    const photoX = pdfPhotoX * scale;
    const firstPhotoY = pdfPhotoY * scale;
    const photoWidth = pdfPhotoWidth * scale;
    const photoHeight = pdfPhotoHeight * scale;
    const photoSpacing = pdfPhotoSpacing * scale;

    for (let i = 0; i < names.length; i++) {
      // Calculate exact Y position for this student's photo
      const photoY = firstPhotoY + (i * photoSpacing);

      // Extract the photo region from the canvas
      const photoCanvas = document.createElement('canvas');
      photoCanvas.width = photoWidth;
      photoCanvas.height = photoHeight;
      const photoContext = photoCanvas.getContext('2d');

      // Fill with white background first
      photoContext.fillStyle = 'white';
      photoContext.fillRect(0, 0, photoWidth, photoHeight);

      // Draw the cropped region
      photoContext.drawImage(
        canvas,
        photoX, photoY, photoWidth, photoHeight, // Source rectangle
        0, 0, photoWidth, photoHeight // Destination rectangle
      );

      const photoDataUrl = photoCanvas.toDataURL('image/jpeg', 0.9);

      students.push({
        name: names[i],
        image: photoDataUrl
      });
    }

    return students;
  };

  const processImageRoster = async (file) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageData = event.target.result;

      // For image files, try to process as a single page screenshot
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const context = canvas.getContext('2d');
        context.drawImage(img, 0, 0);

        // Try to detect and extract students from the image
        // This is a simplified approach - prompts user for manual extraction
        alert(
          'Image roster detected!\n\n' +
          'For best results with image files:\n' +
          '1. Please use the PDF version of your roster if available\n' +
          '2. Or use "Add Manually" to add students one at a time\n\n' +
          'PDF files provide better automatic extraction.'
        );
      };
      img.src = imageData;
    };
    reader.readAsDataURL(file);
  };

  // Practice mode functions
  const getCurrentCard = () => {
    const cards = getCurrentDeckCards();
    return cards[currentCardIndex];
  };

  const nextCard = () => {
    setShowingName(false);
    const cards = getCurrentDeckCards();
    setCurrentCardIndex((currentCardIndex + 1) % cards.length);
  };

  const prevCard = () => {
    setShowingName(false);
    const cards = getCurrentDeckCards();
    setCurrentCardIndex((currentCardIndex - 1 + cards.length) % cards.length);
  };

  const markCorrect = async () => {
    const card = getCurrentCard();
    if (!card) return;

    setSessionStats((prev) => ({ ...prev, correct: prev.correct + 1 }));

    // Update progress for this card via API
    try {
      const newProgress = (card.progress || 0) + 1;
      await decksAPI.updateCardProgress(currentDeckId, card._id, newProgress);
      await loadDecks(); // Reload to get updated progress
    } catch (err) {
      console.error('Error updating progress:', err);
    }

    nextCard();
  };

  const markIncorrect = async () => {
    const card = getCurrentCard();
    if (!card) return;

    setSessionStats((prev) => ({ ...prev, incorrect: prev.incorrect + 1 }));

    // Reset progress for this card via API
    try {
      await decksAPI.updateCardProgress(currentDeckId, card._id, 0);
      await loadDecks(); // Reload to get updated progress
    } catch (err) {
      console.error('Error resetting progress:', err);
    }

    nextCard();
  };

  const resetProgress = async () => {
    setSessionStats({ correct: 0, incorrect: 0 });

    // Reset progress for all cards in current deck
    const deck = getCurrentDeck();
    if (deck) {
      try {
        const resetCards = deck.cards.map(c => ({ ...c, progress: 0 }));
        await updateDeck(currentDeckId, { cards: resetCards });
      } catch (err) {
        console.error('Error resetting progress:', err);
      }
    }

    setCurrentCardIndex(0);
    setShowingName(false);
  };

  const shuffleCards = async () => {
    const deck = getCurrentDeck();
    if (!deck) return;

    const shuffled = [...deck.cards].sort(() => Math.random() - 0.5);
    try {
      await updateDeck(currentDeckId, { cards: shuffled });
      setCurrentCardIndex(0);
      setShowingName(false);
    } catch (err) {
      console.error('Error shuffling cards:', err);
    }
  };

  // Delete card
  const deleteCard = async (deckId, cardId) => {
    try {
      await decksAPI.deleteCard(deckId, cardId);
      await loadDecks(); // Reload decks

      if (currentDeckId === deckId) {
        const cards = getCurrentDeckCards();
        if (currentCardIndex >= cards.length) {
          setCurrentCardIndex(Math.max(0, cards.length - 1));
        }
      }
    } catch (err) {
      console.error('Error deleting card:', err);
      alert('Error deleting card: ' + err.message);
    }
  };

  // Delete entire deck
  const deleteDeck = async (deckId) => {
    try {
      await decksAPI.delete(deckId);
      await loadDecks(); // Reload decks

      if (currentDeckId === deckId) {
        setCurrentDeckId(null);
        setMode('home');
      }
    } catch (err) {
      console.error('Error deleting deck:', err);
      alert('Error deleting deck: ' + err.message);
    }
  };

  // Edit card name
  const updateCardName = async (deckId, cardId, newName) => {
    const deck = decks.find(d => d._id === deckId);
    if (!deck) return;

    try {
      const updatedCards = deck.cards.map(c =>
        c._id === cardId ? { ...c, name: newName } : c
      );
      await updateDeck(deckId, { cards: updatedCards });
      setEditingCardId(null);
      setEditingCardName("");
    } catch (err) {
      console.error('Error updating card name:', err);
      alert('Error updating card name: ' + err.message);
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

  // Calculate deck stats
  const getDeckStats = (deck) => {
    const totalCards = deck.cards.length;
    const masteredCount = deck.cards.filter(c => (c.progress || 0) >= 3).length;
    const masteredPercent = totalCards > 0 ? Math.round((masteredCount / totalCards) * 100) : 0;
    return { totalCards, masteredCount, masteredPercent };
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-editor-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent-blue mx-auto mb-4"></div>
          <p className="text-text-primary text-lg">Loading your decks...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-editor-bg flex items-center justify-center p-8">
        <div className="max-w-md bg-editor-bg-light border border-accent-red rounded-lg p-8 text-center">
          <X size={48} className="text-accent-red mx-auto mb-4" />
          <h2 className="text-xl font-bold text-text-primary mb-2">Error Loading Decks</h2>
          <p className="text-text-secondary mb-6">{error}</p>
          <button
            onClick={loadDecks}
            className="bg-accent-blue hover:bg-accent-blue-hover text-white px-6 py-3 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Render functions for each mode
  const renderHome = () => (
    <div className="min-h-screen bg-editor-bg p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex-1"></div>
            <h1 className="text-4xl font-bold text-text-primary flex-1">Student Name Flashcards</h1>
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
            onClick={() => setMode("manual")}
            className="bg-editor-bg-light border-2 border-editor-border rounded-2xl p-8 hover:bg-editor-bg-lighter hover:border-accent-green transition-all duration-200 text-left group shadow-lg hover:shadow-xl"
          >
            <div className="w-20 h-20 bg-accent-green rounded-2xl flex items-center justify-center mb-6 group-hover:bg-accent-green-hover transition-colors shadow-lg">
              <Plus size={36} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-text-primary">Add Manually</h2>
            <p className="text-text-secondary text-base">Paste or upload photos one at a time</p>
          </button>

          {/* Roster Upload */}
          <button
            onClick={() => setMode("roster")}
            className="bg-editor-bg-light border-2 border-editor-border rounded-2xl p-8 hover:bg-editor-bg-lighter hover:border-accent-purple transition-all duration-200 text-left group shadow-lg hover:shadow-xl"
          >
            <div className="w-20 h-20 bg-accent-purple rounded-2xl flex items-center justify-center mb-6 group-hover:bg-accent-purple-hover transition-colors shadow-lg">
              <Users size={36} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-text-primary">Upload Roster</h2>
            <p className="text-text-secondary text-base">Auto-extract from class roster PDF</p>
          </button>

          {/* Practice - now opens deck selector */}
          <button
            onClick={() => (decks.length > 0 ? setMode("deckSelect") : null)}
            disabled={decks.length === 0}
            className={`bg-editor-bg-light border-2 border-editor-border rounded-2xl p-8 transition-all duration-200 text-left group shadow-lg ${
              decks.length === 0
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-editor-bg-lighter hover:border-accent-blue hover:shadow-xl"
            }`}
          >
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 transition-colors shadow-lg ${
              decks.length > 0
                ? "bg-accent-blue group-hover:bg-accent-blue-hover"
                : "bg-gray-600"
            }`}>
              <RotateCcw size={36} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-text-primary">Practice</h2>
            <p className="text-text-secondary text-base">
              {decks.length === 0
                ? "Add cards first"
                : `${decks.length} deck${decks.length !== 1 ? 's' : ''} available`}
            </p>
          </button>
        </div>

        {/* Decks overview */}
        {decks.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold text-text-primary">Your Decks</h3>
            {decks.map((deck) => {
              const stats = getDeckStats(deck);
              return (
                <div key={deck._id} className="bg-editor-bg-light border border-editor-border rounded-lg p-6">
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
                        onClick={() => {
                          setCurrentDeckId(deck._id);
                          setCurrentCardIndex(0);
                          setMode("practice");
                        }}
                        className="bg-accent-blue hover:bg-accent-blue-hover text-white px-4 py-2 rounded transition-colors"
                      >
                        Practice
                      </button>
                      <button
                        onClick={() => deleteDeck(deck._id)}
                        className="bg-accent-red hover:bg-accent-red-hover text-white px-4 py-2 rounded transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {deck.cards.slice(0, 12).map((card) => {
                      const isMastered = (card.progress || 0) >= 3;
                      const isEditing = editingCardId === card._id;
                      return (
                        <div key={card._id} className="group relative">
                          <div className="rounded-lg overflow-hidden border border-editor-border" style={{aspectRatio: '111/147', position: 'relative', backgroundColor: '#fff'}}>
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
                              onClick={() => {
                                setEditingCardId(card._id);
                                setEditingCardName(card.name);
                              }}
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
                                onChange={(e) => setEditingCardName(e.target.value)}
                                className="flex-1 text-xs bg-editor-bg border border-accent-blue rounded px-1 py-0.5 text-text-primary"
                                autoFocus
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    updateCardName(deck._id, card._id, editingCardName);
                                  }
                                }}
                              />
                              <button
                                onClick={() => updateCardName(deck._id, card._id, editingCardName)}
                                className="text-accent-green hover:text-accent-green-hover"
                              >
                                <Save size={12} />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingCardId(null);
                                  setEditingCardName("");
                                }}
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
                    })}
                    {deck.cards.length > 12 && (
                      <div className="flex items-center justify-center text-text-secondary text-sm">
                        +{deck.cards.length - 12} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // Deck selection mode
  const renderDeckSelect = () => (
    <div className="min-h-screen bg-editor-bg p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => setMode("home")}
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
                onClick={() => {
                  setCurrentDeckId(deck._id);
                  setCurrentCardIndex(0);
                  setSessionStats({ correct: 0, incorrect: 0 });
                  setMode("practice");
                }}
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

  const renderManual = () => (
    <div className="min-h-screen bg-editor-bg p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => setMode("home")}
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
              onChange={(e) => setTempDeckName(e.target.value)}
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
            onPaste={handleImagePaste}
          >
            {tempImage ? (
              <div className="flex flex-col items-center gap-4">
                <img
                  src={tempImage}
                  alt="Student preview"
                  className="max-w-sm max-h-72 rounded-lg shadow-lg border border-editor-border"
                />
                <button
                  onClick={() => setTempImage(null)}
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
                  onChange={handleImageUpload}
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
              onChange={(e) => setTempName(e.target.value)}
              placeholder="First Last"
              className="w-full bg-editor-bg border border-editor-border rounded-lg px-5 py-3.5 text-text-primary text-lg placeholder-text-muted focus:outline-none focus:border-accent-blue focus:ring-2 focus:ring-accent-blue focus:ring-opacity-20 transition-all"
              onKeyPress={(e) => {
                if (e.key === "Enter" && tempImage && tempName.trim() && tempDeckName.trim()) {
                  addManualCard();
                }
              }}
            />
          </div>

          {/* Add button */}
          <button
            onClick={addManualCard}
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

  const renderRoster = () => (
    <div className="min-h-screen bg-editor-bg p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => setMode("home")}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary mb-8 transition-colors px-2 py-1 hover:bg-editor-bg-light rounded"
        >
          <ChevronLeft size={20} />
          Back to Home
        </button>

        <div className="bg-editor-bg-light border border-editor-border rounded-lg p-6 md:p-10 shadow-xl">
          <h2 className="text-3xl font-bold mb-8 text-text-primary">Upload Class Roster</h2>

          {/* Class name input */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-3 text-text-primary uppercase tracking-wide">
              Deck / Class Name
            </label>
            <input
              type="text"
              value={rosterClassName}
              onChange={(e) => setRosterClassName(e.target.value)}
              placeholder="e.g., CS178_S1"
              list="existing-decks-roster"
              className="w-full bg-editor-bg border border-editor-border rounded-lg px-5 py-3.5 text-text-primary text-lg placeholder-text-muted focus:outline-none focus:border-accent-purple focus:ring-2 focus:ring-accent-purple focus:ring-opacity-20 transition-all"
            />
            <datalist id="existing-decks-roster">
              {decks.map(deck => (
                <option key={deck._id} value={deck.name} />
              ))}
            </datalist>
            <p className="text-xs text-text-secondary mt-2">
              This will be auto-filled from your filename, but you can edit it
            </p>
          </div>

          {/* File upload area */}
          <div className={`border-2 border-dashed rounded-lg p-12 mb-6 relative min-h-[240px] flex items-center justify-center transition-all duration-200 ${
            rosterProcessing
              ? 'border-accent-purple bg-editor-bg'
              : 'border-editor-border hover:border-accent-purple hover:bg-editor-bg'
          }`}>
            {rosterProcessing ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent-purple mx-auto mb-4"></div>
                <p className="text-text-primary text-lg font-medium">Processing roster...</p>
                <p className="text-text-secondary text-sm mt-2">This may take a moment</p>
              </div>
            ) : rosterFile ? (
              <div className="text-center">
                <div className="bg-accent-purple bg-opacity-10 rounded-lg p-6 mb-4">
                  <p className="text-text-primary font-semibold mb-1">{rosterFile.name}</p>
                  <p className="text-text-secondary text-sm">
                    {rosterFile.type === 'application/pdf' ? 'PDF Document' : 'Image File'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setRosterFile(null);
                    setRosterClassName('');
                  }}
                  className="text-accent-red hover:underline text-sm"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <Upload size={56} className="mx-auto mb-5 text-accent-purple" />
                <p className="text-text-primary mb-2 text-lg font-medium">
                  Click to upload your class roster
                </p>
                <p className="text-sm text-text-secondary mb-4">
                  PDF files or images (PNG, JPG)
                </p>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleRosterFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Upload button */}
          <button
            onClick={handleRosterUpload}
            disabled={!rosterFile || !rosterClassName.trim() || rosterProcessing}
            className={`w-full py-4 rounded-lg font-semibold text-lg transition-all duration-200 mb-8 ${
              !rosterFile || !rosterClassName.trim() || rosterProcessing
                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-accent-purple hover:bg-accent-purple-hover text-white shadow-lg hover:shadow-xl hover:scale-[1.02]"
            }`}
          >
            {rosterProcessing ? 'Processing...' : 'Process Roster'}
          </button>

          <div className="space-y-6">
            <div className="bg-accent-purple bg-opacity-10 border border-accent-purple rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3 text-text-primary flex items-center gap-2">
                <Check size={20} className="text-accent-purple" />
                How It Works
              </h3>
              <div className="space-y-3 text-text-secondary">
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-accent-purple text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  <p>Upload your Drake roster PDF (the one with student photos and names)</p>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-accent-purple text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                  <p>We'll automatically extract each student's photo and name</p>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-accent-purple text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                  <p>Flashcards are created instantly - ready to practice!</p>
                </div>
              </div>
            </div>

            <div className="bg-editor-bg-lighter border border-editor-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2 text-text-primary">💡 Tips</h3>
              <ul className="text-text-secondary space-y-2 list-disc list-inside">
                <li>Works best with standard Drake roster format (4 students per page)</li>
                <li>PDF files give better results than screenshots</li>
                <li>All pages are processed automatically - no need to split the file</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPractice = () => {
    const deck = getCurrentDeck();
    if (!deck) {
      setMode("home");
      return null;
    }

    const cards = getCurrentDeckCards();
    if (cards.length === 0) {
      return (
        <div className="min-h-screen bg-editor-bg p-8">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => setMode("home")}
              className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-8"
            >
              <ChevronLeft size={20} />
              Back to Home
            </button>
            <div className="bg-editor-bg-light border border-editor-border rounded-lg p-12 text-center">
              <h2 className="text-2xl font-bold text-text-primary mb-4">All students mastered! 🎉</h2>
              <p className="text-text-secondary mb-6">You've mastered all students in this deck. Great job!</p>
              <button
                onClick={() => setHideMastered(false)}
                className="bg-accent-blue hover:bg-accent-blue-hover text-white px-6 py-3 rounded-lg transition-colors"
              >
                Show All Students
              </button>
            </div>
          </div>
        </div>
      );
    }

    const currentCard = getCurrentCard();
    const progress = currentCardIndex + 1;
    const total = cards.length;
    const stats = getDeckStats(deck);

    return (
      <div className="min-h-screen bg-editor-bg p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => {
                setMode("home");
                setHideMastered(false);
              }}
              className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
            >
              <ChevronLeft size={20} />
              Back to Home
            </button>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setHideMastered(!hideMastered);
                  setCurrentCardIndex(0);
                  setShowingName(false);
                }}
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
                onClick={shuffleCards}
                className="flex items-center gap-2 bg-editor-bg-light border border-editor-border hover:bg-editor-bg-lighter px-4 py-2 rounded transition-colors text-text-primary"
              >
                <RotateCcw size={16} />
                Shuffle
              </button>
              <button
                onClick={resetProgress}
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
                        onClick={markIncorrect}
                        className="flex items-center gap-2 bg-accent-red hover:bg-accent-red-hover text-white px-6 py-3 rounded-lg transition-colors"
                      >
                        <X size={24} />
                        Missed (N)
                      </button>
                      <button
                        onClick={markCorrect}
                        className="flex items-center gap-2 bg-accent-green hover:bg-accent-green-hover text-white px-6 py-3 rounded-lg transition-colors"
                      >
                        <Check size={24} />
                        Got It! (Y)
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowingName(true)}
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
              onClick={prevCard}
              className="flex items-center gap-2 bg-editor-bg-light border border-editor-border hover:bg-editor-bg-lighter px-4 py-2 rounded transition-colors text-text-primary"
            >
              <ChevronLeft size={20} />
              Previous
            </button>

            <div className="text-sm text-text-secondary">
              Use arrow keys to navigate • Space to reveal • Y/N to grade
            </div>

            <button
              onClick={nextCard}
              className="flex items-center gap-2 bg-editor-bg-light border border-editor-border hover:bg-editor-bg-lighter px-4 py-2 rounded transition-colors text-text-primary"
            >
              Next
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Main render
  return (
    <div>
      {mode === "home" && renderHome()}
      {mode === "manual" && renderManual()}
      {mode === "roster" && renderRoster()}
      {mode === "deckSelect" && renderDeckSelect()}
      {mode === "practice" && renderPractice()}
    </div>
  );
}

export default StudentFlashcards;
