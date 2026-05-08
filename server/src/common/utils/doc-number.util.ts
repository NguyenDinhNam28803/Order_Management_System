import { randomInt } from 'crypto';

/**
 * Generates a unique document number using cryptographically-secure randomness.
 * Format: <PREFIX>-<YYYY>-<6-digit random>
 * Example: PO-2026-482931
 *
 * Uses crypto.randomInt (Node.js built-in) instead of Math.random() to avoid
 * the weak PRNG collision risk when many documents are created concurrently.
 * 900,000 values per year per prefix keeps collision probability negligible for
 * typical SMB transaction volumes.
 */
export function generateDocNumber(prefix: string): string {
  const year = new Date().getFullYear();
  const rand = randomInt(100000, 999999);
  return `${prefix}-${year}-${rand}`;
}
