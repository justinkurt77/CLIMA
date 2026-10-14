import DOMPurify from 'dompurify';

/**
 * Sanitize user-generated content to prevent XSS attacks
 * @param {string} dirty - Unsanitized content
 * @param {object} options - DOMPurify configuration options
 * @returns {string} - Sanitized safe content
 */
export function sanitizeHTML(dirty, options = {}) {
  if (!dirty) return '';
  
  const defaultConfig = {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'p', 'br', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    ...options
  };

  return DOMPurify.sanitize(dirty, defaultConfig);
}

/**
 * Sanitize plain text (strip all HTML tags)
 * @param {string} dirty - Unsanitized content
 * @returns {string} - Plain text only
 */
export function sanitizeText(dirty) {
  if (!dirty) return '';
  
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
}

/**
 * Sanitize for display in React components using dangerouslySetInnerHTML
 * @param {string} dirty - Unsanitized HTML content
 * @returns {object} - Object with __html property for dangerouslySetInnerHTML
 */
export function createSafeMarkup(dirty) {
  return {
    __html: sanitizeHTML(dirty)
  };
}
