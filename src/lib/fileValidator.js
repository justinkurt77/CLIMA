/**
 * File Upload Validation Utility
 * 
 * Validates uploaded files using multiple security layers:
 * 1. Extension whitelist check
 * 2. MIME type validation
 * 3. File size limits
 * 
 * Prevents common upload attacks like:
 * - Extension spoofing (malware.exe renamed to malware.jpg)
 * - Oversized uploads (DoS)
 * 
 * Note: For full production security, implement server-side magic byte validation
 * using file-type package in a Node.js backend endpoint.
 */

// Configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB for avatars

// Allowed extensions (without dot)
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'heic'];

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif'
];

/**
 * Validates an image file using multiple security checks
 * 
 * @param {File} file - The file to validate
 * @param {Object} options - Validation options
 * @param {number} options.maxSize - Maximum file size in bytes (default: MAX_FILE_SIZE)
 * @param {boolean} options.isAvatar - Whether this is an avatar upload (uses smaller max size)
 * @returns {Promise<{valid: boolean, error?: string}>} Validation result
 */
export async function validateImageFile(file, options = {}) {
  const maxSize = options.isAvatar ? MAX_AVATAR_SIZE : (options.maxSize || MAX_FILE_SIZE);
  
  // Check 1: File exists
  if (!file || !(file instanceof File)) {
    return { valid: false, error: 'No file provided' };
  }

  // Check 2: File size
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    return { valid: false, error: `File too large. Maximum size: ${maxSizeMB}MB` };
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }

  // Check 3: Extension whitelist
  const fileName = file.name.toLowerCase();
  const extension = fileName.split('.').pop();
  
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `Invalid file extension. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`
    };
  }

  // Check 4: MIME type validation
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`
    };
  }

  // Check 5: Basic image validation - try to load as image
  try {
    await validateImageContent(file);
  } catch (error) {
    return {
      valid: false,
      error: 'File is not a valid image or is corrupted'
    };
  }

  // All checks passed
  return { valid: true };
}

/**
 * Validates that file is actually an image by attempting to load it
 */
function validateImageContent(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Invalid image'));
    };
    
    img.src = url;
  });
}

/**
 * Validates multiple image files and returns validation results
 * 
 * @param {FileList|File[]} files - Files to validate
 * @param {Object} options - Validation options
 * @param {number} options.maxFiles - Maximum number of files allowed
 * @param {number} options.maxTotalSize - Maximum total size of all files
 * @returns {Promise<{valid: boolean, errors: string[], validFiles: File[]}>}
 */
export async function validateImageFiles(files, options = {}) {
  const { maxFiles = 4, maxTotalSize = MAX_FILE_SIZE } = options;
  
  const filesArray = Array.from(files);
  const errors = [];
  const validFiles = [];

  // Check total file count
  if (filesArray.length > maxFiles) {
    return {
      valid: false,
      errors: [`Maximum ${maxFiles} files allowed`],
      validFiles: []
    };
  }

  // Check total size
  const totalSize = filesArray.reduce((sum, file) => sum + file.size, 0);
  if (totalSize > maxTotalSize) {
    const maxSizeMB = (maxTotalSize / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      errors: [`Total file size exceeds ${maxSizeMB}MB limit`],
      validFiles: []
    };
  }

  // Validate each file
  for (const file of filesArray) {
    const result = await validateImageFile(file, options);
    
    if (result.valid) {
      validFiles.push(file);
    } else {
      errors.push(`${file.name}: ${result.error}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    validFiles
  };
}

/**
 * Helper function to check if a file extension is allowed
 * (Client-side only, for quick UI feedback before full validation)
 */
export function isExtensionAllowed(filename) {
  const extension = filename.toLowerCase().split('.').pop();
  return ALLOWED_EXTENSIONS.includes(extension);
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
