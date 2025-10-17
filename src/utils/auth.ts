import { createHmac, randomBytes } from 'crypto';

const SECRET_KEY = process.env.AUTH_SECRET || 'chlm-default-secret-2025';

export function createAuthToken(): string {
  const timestamp = Date.now().toString();
  const random = randomBytes(16).toString('hex');
  const payload = `${timestamp}:${random}`;

  const signature = createHmac('sha256', SECRET_KEY)
    .update(payload)
    .digest('hex');

  return `${payload}:${signature}`;
}

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
