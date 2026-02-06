import crypto from 'crypto';

// Use a secret key from environment or generate a default one
// In production, this MUST be set in environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypt a string using AES-256-GCM
 * Returns a base64 encoded string containing IV + AuthTag + Encrypted Data
 */
export function encrypt(text: string): string {
  // Ensure key is exactly 32 bytes for AES-256
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Combine IV + AuthTag + Encrypted data
  const combined = Buffer.concat([
    iv,
    authTag,
    Buffer.from(encrypted, 'hex')
  ]);
  
  return combined.toString('base64');
}

/**
 * Decrypt a string that was encrypted with the encrypt function
 */
export function decrypt(encryptedText: string): string {
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const combined = Buffer.from(encryptedText, 'base64');
  
  // Extract IV, AuthTag, and encrypted data
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Mask a connection string for display (show only host)
 */
export function maskConnectionString(url: string): string {
  try {
    const parsed = new URL(url);
    return `postgresql://***@${parsed.host}/***`;
  } catch {
    return '***configured***';
  }
}
