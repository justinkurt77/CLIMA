// Security utilities for CLIMA

/**
 * XSS Protection: Sanitize user input
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Password strength validator
 * Returns: { isStrong: boolean, message: string, score: number }
 */
export function validatePasswordStrength(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  let score = 0;
  let weaknesses = [];

  if (password.length < minLength) {
    weaknesses.push(`at least ${minLength} characters`);
  } else {
    score += 1;
  }

  if (!hasUpperCase) {
    weaknesses.push('uppercase letter');
  } else {
    score += 1;
  }

  if (!hasLowerCase) {
    weaknesses.push('lowercase letter');
  } else {
    score += 1;
  }

  if (!hasNumbers) {
    weaknesses.push('number');
  } else {
    score += 1;
  }

  if (!hasSpecialChar) {
    weaknesses.push('special character');
  } else {
    score += 1;
  }

  const isStrong = score >= 4;
  const message = isStrong
    ? 'Strong password'
    : `Password should include: ${weaknesses.join(', ')}`;

  return { isStrong, message, score };
}

/**
 * Generate CSRF token
 */
export function generateCSRFToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Rate limiter for client-side actions
 */
class RateLimiter {
  constructor(maxAttempts = 5, windowMs = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    this.attempts = new Map();
  }

  check(key) {
    const now = Date.now();
    const userAttempts = this.attempts.get(key) || [];

    // Filter out old attempts outside the window
    const recentAttempts = userAttempts.filter((time) => now - time < this.windowMs);

    if (recentAttempts.length >= this.maxAttempts) {
      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: Math.ceil((recentAttempts[0] + this.windowMs - now) / 1000),
      };
    }

    // Add current attempt
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);

    return {
      allowed: true,
      remainingAttempts: this.maxAttempts - recentAttempts.length,
      resetTime: Math.ceil(this.windowMs / 1000),
    };
  }

  reset(key) {
    this.attempts.delete(key);
  }
}

export const loginRateLimiter = new RateLimiter(5, 5 * 60 * 1000); // 5 attempts per 5 minutes
export const reportRateLimiter = new RateLimiter(10, 15 * 60 * 1000); // 10 reports per 15 minutes

/**
 * Validate file upload
 */
export function validateFileUpload(file, options = {}) {
  const {
    maxSizeMB = 5,
    allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
  } = options;

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size must be less than ${maxSizeMB}MB`,
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Secure cookie configuration
 */
export const secureCookieOptions = {
  httpOnly: true,
  secure: window.location.protocol === 'https:',
  sameSite: 'strict',
  maxAge: 24 * 60 * 60, // 24 hours
};

/**
 * Content Security Policy headers (for reference, implement on server)
 */
export const cspDirectives = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", 'https://api.mapbox.com'],
  'style-src': ["'self'", "'unsafe-inline'", 'https://api.mapbox.com'],
  'img-src': ["'self'", 'data:', 'https:', 'blob:'],
  'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
  'connect-src': [
    "'self'",
    'https://*.supabase.co',
    'https://api.mapbox.com',
    'wss://*.supabase.co',
  ],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
};

/**
 * SQL Injection Prevention (for parameterized queries reminder)
 */
export const sqlInjectionNote = `
  Always use parameterized queries with Supabase:
  
  ✅ SAFE:
  supabase.from('table').select().eq('column', userInput)
  
  ❌ UNSAFE:
  supabase.rpc('raw_query', { query: 'SELECT * FROM table WHERE id = ' + userInput })
`;

/**
 * Webhook signature validation (Facebook, etc.)
 */
export function validateWebhookSignature(payload, signature, secret) {
  const crypto = window.crypto || window.msCrypto;
  const encoder = new TextEncoder();

  return crypto.subtle
    .importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    .then((key) => crypto.subtle.sign('HMAC', key, encoder.encode(payload)))
    .then((signatureBuffer) => {
      const signatureArray = Array.from(new Uint8Array(signatureBuffer));
      const signatureHex = signatureArray
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
      return signatureHex === signature;
    });
}

/**
 * Audit log helper
 */
export async function logAuditEvent(supabase, event) {
  try {
    await supabase.from('audit_logs').insert({
      action: event.action,
      table_name: event.table,
      record_id: event.recordId,
      old_values: event.oldValues,
      new_values: event.newValues,
      user_id: event.userId,
      ip_address: event.ipAddress,
      user_agent: navigator.userAgent,
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

/**
 * Session timeout handler
 */
export class SessionManager {
  constructor(timeoutMinutes = 30) {
    this.timeoutMs = timeoutMinutes * 60 * 1000;
    this.warningMs = 5 * 60 * 1000; // 5 minutes warning
    this.activityTimer = null;
    this.warningTimer = null;
    this.onWarning = null;
    this.onTimeout = null;
  }

  start(onWarning, onTimeout) {
    this.onWarning = onWarning;
    this.onTimeout = onTimeout;
    this.resetTimer();

    // Listen for user activity
    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach((event) => {
      document.addEventListener(event, () => this.resetTimer(), true);
    });
  }

  resetTimer() {
    clearTimeout(this.activityTimer);
    clearTimeout(this.warningTimer);

    // Set warning timer
    this.warningTimer = setTimeout(() => {
      if (this.onWarning) this.onWarning();
    }, this.timeoutMs - this.warningMs);

    // Set timeout timer
    this.activityTimer = setTimeout(() => {
      if (this.onTimeout) this.onTimeout();
    }, this.timeoutMs);
  }

  stop() {
    clearTimeout(this.activityTimer);
    clearTimeout(this.warningTimer);
  }
}

export default {
  sanitizeInput,
  isValidEmail,
  validatePasswordStrength,
  generateCSRFToken,
  loginRateLimiter,
  reportRateLimiter,
  validateFileUpload,
  secureCookieOptions,
  cspDirectives,
  validateWebhookSignature,
  logAuditEvent,
  SessionManager,
};
