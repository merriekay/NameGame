import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * Service for parsing class rosters (PDF and image files)
 * Extracts student names and photos from Drake roster format
 */

/**
 * Process a PDF roster file and extract student data
 */
export async function processPDFRoster(file) {
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

    // Parse student entries from this page
    const students = await parseStudentsFromPage(textContent, canvas, viewport);
    allStudents.push(...students);
  }

  return allStudents.map(student => ({
    image: student.image,
    name: student.name,
    progress: 0
  }));
}

/**
 * Parse student data from a single PDF page
 */
async function parseStudentsFromPage(textContent, canvas, viewport) {
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
}

/**
 * Process an image roster file
 * Currently prompts user to use PDF or manual entry
 */
export async function processImageRoster(file) {
  return new Promise((resolve, reject) => {
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

        reject(new Error('Image processing not fully supported'));
      };
      img.src = imageData;
    };
    reader.readAsDataURL(file);
  });
}
