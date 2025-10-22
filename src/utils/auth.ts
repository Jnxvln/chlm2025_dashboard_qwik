/**
 * Authentication utilities for generating and verifying secure tokens
 * @module utils/auth
 */

import { createHmac, randomBytes } from 'crypto';

// Secret key for HMAC signing - should be set via environment variable
const SECRET_KEY = process.env.AUTH_SECRET || 'chlm-default-secret-2025';

/**
 * Creates a secure authentication token with HMAC signature.
 *
 * The token format is: `timestamp:random:signature`
 * - timestamp: Unix timestamp when token was created
 * - random: 16 random bytes in hex format
 * - signature: HMAC-SHA256 signature of the payload
 *
 * Tokens expire after 24 hours.
 *
 * @returns A signed authentication token string
 *
 * @example
 * ```typescript
 * const token = createAuthToken();
 * // Store token in session or cookie
 * ```
 */
export function createAuthToken(): string {
  const timestamp = Date.now().toString();
  const random = randomBytes(16).toString('hex');
  const payload = `${timestamp}:${random}`;

  const signature = createHmac('sha256', SECRET_KEY)
    .update(payload)
    .digest('hex');

  return `${payload}:${signature}`;
}

/**
 * Verifies an authentication token's signature and expiration.
 *
 * Checks:
 * 1. Token format is correct (timestamp:random:signature)
 * 2. Signature matches the expected HMAC-SHA256 hash
 * 3. Token is not expired (< 24 hours old)
 *
 * @param token - The authentication token to verify
 * @returns `true` if token is valid and not expired, `false` otherwise
 *
 * @example
 * ```typescript
 * if (!verifyAuthToken(req.cookies.authToken)) {
 *   return redirect('/login');
 * }
 * ```
 */
export function verifyAuthToken(token: string): boolean {
  try {
    const parts = token.split(':');
    if (parts.length !== 3) {
      return false;
    }

    const [timestamp, random, signature] = parts;
    const payload = `${timestamp}:${random}`;

    const expectedSignature = createHmac('sha256', SECRET_KEY)
      .update(payload)
      .digest('hex');

    // Verify signature
    if (signature !== expectedSignature) {
      return false;
    }

    // Check if token is expired (24 hours)
    const tokenAge = Date.now() - parseInt(timestamp);
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    return tokenAge < maxAge;
  } catch {
    return false;
  }
}
