import { ChevronLeft, Upload, Check } from "lucide-react";

/**
 * Roster upload page for batch import
 */
function RosterUploadPage({
  decks,
  rosterFile,
  rosterClassName,
  rosterProcessing,
  onBack,
  onFileSelect,
  onClassNameChange,
  onUpload,
  onFileClear
}) {
  return (
    <div className="min-h-screen bg-editor-bg p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
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
              onChange={(e) => onClassNameChange(e.target.value)}
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
                  onClick={onFileClear}
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
                  onChange={onFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Upload button */}
          <button
            onClick={onUpload}
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
}

export default RosterUploadPage;
