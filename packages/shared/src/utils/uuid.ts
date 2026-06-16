/** Generate a unique ID (works in Node.js main process, Electron renderer, and browser) */
export function generateId(): string {
  // 1. Try Web Crypto API global (available in browsers and Electron renderer)
  //    In Node.js 18 (Electron 28), globalThis.crypto provides the Web Crypto API
  const globalCrypto = typeof globalThis !== 'undefined' && typeof globalThis.crypto !== 'undefined'
    ? globalThis.crypto
    : typeof crypto !== 'undefined' ? crypto : null;

  if (globalCrypto && typeof globalCrypto.randomUUID === 'function') {
    return globalCrypto.randomUUID();
  }

  // 2. Fallback using crypto.getRandomValues (RFC4122 version 4 UUID)
  if (globalCrypto && globalCrypto.getRandomValues) {
    const bytes = new Uint8Array(16);
    globalCrypto.getRandomValues(bytes);
    // Set version 4 and variant bits per RFC4122
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
  }

  // 3. Node.js crypto module fallback (for Electron main process where Web Crypto is not global)
  try {
    // Dynamic require to avoid bundler issues in browser contexts
    const nodeCrypto = require('crypto');
    if (nodeCrypto && typeof nodeCrypto.randomUUID === 'function') {
      return nodeCrypto.randomUUID();
    }
    // Fallback: use randomBytes to build a UUID v4
    const bytes = nodeCrypto.randomBytes(16);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = bytes.toString('hex');
    return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
  } catch {
    // Node.js crypto not available (browser context without Web Crypto)
  }

  throw new Error('No secure random number generator available. crypto.randomUUID, crypto.getRandomValues, or Node.js crypto is required.');
}
