import { fileTypeFromBlob } from 'file-type';

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Validates an image file by checking extension, MIME type, and magic bytes
 * @param {File} file - The file to validate
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
export async function validateImageFile(file) {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size exceeds 10MB limit' };
  }

  // Check extension
  const fileName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
  if (!hasValidExtension) {
    return { valid: false, error: 'Invalid file extension. Only JPG, JPEG, PNG, and WEBP are allowed.' };
  }

  // Check MIME type from file object
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid MIME type. File may be renamed or corrupted.' };
  }

  // Check magic bytes (file signature)
  try {
    const fileType = await fileTypeFromBlob(file);
    
    if (!fileType) {
      return { valid: false, error: 'Could not determine file type. File may be corrupted.' };
    }

    if (!ALLOWED_MIME_TYPES.includes(fileType.mime)) {
      return { valid: false, error: `Invalid file signature. Expected image, got ${fileType.ext || 'unknown'}.` };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Failed to validate file: ' + error.message };
  }
}
