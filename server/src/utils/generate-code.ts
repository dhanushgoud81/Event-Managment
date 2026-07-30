import crypto from 'crypto';

/**
 * Generate a unique referral code (8 characters, uppercase alphanumeric)
 */
export function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars: I, O, 0, 1
  let code = '';
  const randomBytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) {
    code += chars[randomBytes[i] % chars.length];
  }
  return code;
}

/**
 * Generate a unique registration number
 * Format: EVT-YYYYMMDD-XXXXX (e.g., EVT-20260730-A3B2C)
 */
export function generateRegistrationNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  const randomBytes = crypto.randomBytes(5);
  for (let i = 0; i < 5; i++) {
    suffix += chars[randomBytes[i] % chars.length];
  }
  return `EVT-${dateStr}-${suffix}`;
}

/**
 * Generate a unique order ID for payments
 * Format: ORD-timestamp-random
 */
export function generateOrderId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

/**
 * Generate a unique QR code string
 */
export function generateQRCodeString(registrationId: string): string {
  const random = crypto.randomBytes(8).toString('hex');
  const hash = crypto
    .createHash('sha256')
    .update(`${registrationId}:${random}:${Date.now()}`)
    .digest('hex')
    .slice(0, 16);
  return `QR-${hash.toUpperCase()}`;
}

/**
 * Generate a URL-safe slug from a string
 */
export function generateSlug(text: string): string {
  const base = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const suffix = crypto.randomBytes(3).toString('hex');
  return `${base}-${suffix}`;
}
