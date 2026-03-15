import { randomBytes } from 'crypto';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function generateSlug(length = 6): string {
  const bytes = randomBytes(length * 2);
  let result = '';
  for (let i = 0; i < bytes.length && result.length < length; i++) {
    const index = bytes[i] % ALPHABET.length;
    result += ALPHABET[index];
  }
  return result;
}

const BLOCKED_PROTOCOLS = ['javascript:', 'data:', 'file:'];

export function isUrlSafe(url: string): boolean {
  const lower = url.toLowerCase().trim();
  return !BLOCKED_PROTOCOLS.some((p) => lower.startsWith(p));
}
