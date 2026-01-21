/**
 * Utility functions for handling image uploads and paste events
 */

/**
 * Handle file input image upload
 */
export function handleImageUpload(file, callback) {
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      callback(event.target.result);
    };
    reader.readAsDataURL(file);
  }
}

/**
 * Handle paste event for images
 */
export function handleImagePaste(e, callback) {
  const items = e.clipboardData?.items;
  if (!items) return;

  for (let item of items) {
    if (item.type.indexOf("image") !== -1) {
      const file = item.getAsFile();
      const reader = new FileReader();
      reader.onload = (event) => {
        callback(event.target.result);
      };
      reader.readAsDataURL(file);
      break;
    }
  }
}
