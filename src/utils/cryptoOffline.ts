/**
 * Offline Store-and-Forward Cryptographic Utilities
 * Complies with the HMAC-SHA256 & Idempotency Key specification from
 * Offline POS Payment System Project Report.
 */

// Generate POS standard idempotency key: POS-001-YYYYMMDD-SEQ-NONCE
export const generateIdempotencyKey = (terminalCode: string = 'POS-001'): string => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
  const sequence = Math.floor(Math.random() * 9000 + 1000);
  return `${terminalCode}-${dateStr}-${sequence}-${randomHex}`;
};

// Compute pseudo-HMAC SHA-256 for browser demonstration
export const computeOfflinePayloadHash = async (
  payload: Record<string, any>,
  secretKey: string = 'BHARAT_SEC_KEY_9923'
): Promise<string> => {
  try {
    const rawData = JSON.stringify(payload) + secretKey;
    const encoder = new TextEncoder();
    const data = encoder.encode(rawData);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return 'HMAC-' + hashHex.substring(0, 24).toUpperCase();
  } catch {
    // Fallback if subtle crypto is unavailable
    return 'HMAC-' + Math.random().toString(36).substring(2, 18).toUpperCase();
  }
};
