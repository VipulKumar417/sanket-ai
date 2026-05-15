/**
 * Gemini API Key Rotation Manager
 *
 * Reads all GEMINI_API_KEY_1 … GEMINI_API_KEY_N from the environment,
 * maintains a global round-robin index (persists across requests in the
 * same Node.js process), and automatically advances to the next key
 * whenever a 429 / RESOURCE_EXHAUSTED error is received.
 *
 * Usage:
 *   import { getNextKey, markKeyExhausted } from '@/lib/keyRotation';
 */

// ── collect all keys from env ──────────────────────────────────────────────
function loadKeys(): string[] {
  const keys: string[] = [];
  let i = 1;
  while (true) {
    const key = process.env[`GEMINI_API_KEY_${i}`];
    if (!key) break;
    keys.push(key.trim());
    i++;
  }
  // fall back to a single GEMINI_API_KEY if numbered ones aren't set
  if (keys.length === 0 && process.env.GEMINI_API_KEY) {
    keys.push(process.env.GEMINI_API_KEY.trim());
  }
  return keys;
}

// ── module-level state (shared across all requests in one process) ─────────
const ALL_KEYS: string[] = loadKeys();

// Track which keys are currently rate-limited and when they reset
const exhaustedUntil: Map<string, number> = new Map();

// Round-robin cursor
let cursor = 0;

// ── public API ─────────────────────────────────────────────────────────────

/**
 * Returns the next available (non-exhausted) API key.
 * Throws if all keys are currently exhausted.
 */
export function getNextKey(): string {
  const now = Date.now();
  const total = ALL_KEYS.length;

  // Try up to `total` keys starting from current cursor
  for (let attempt = 0; attempt < total; attempt++) {
    const idx = (cursor + attempt) % total;
    const key = ALL_KEYS[idx];
    const resetAt = exhaustedUntil.get(key) ?? 0;

    if (now >= resetAt) {
      // advance cursor for the next call
      cursor = (idx + 1) % total;
      return key;
    }
  }

  // All keys exhausted — find the one that recovers soonest
  let soonestReset = Infinity;
  for (const key of ALL_KEYS) {
    const resetAt = exhaustedUntil.get(key) ?? 0;
    if (resetAt < soonestReset) soonestReset = resetAt;
  }

  const waitSec = Math.ceil((soonestReset - now) / 1000);
  throw new Error(`All ${total} Gemini API keys are rate-limited. Retry in ~${waitSec}s.`);
}

/**
 * Call this when a key receives a 429 response.
 * @param key        The exhausted API key
 * @param retryAfterSec  Optional retry-after seconds from the API response (default 65s)
 */
export function markKeyExhausted(key: string, retryAfterSec = 65): void {
  const resetAt = Date.now() + retryAfterSec * 1000;
  exhaustedUntil.set(key, resetAt);
  console.warn(
    `[KeyRotation] Key …${key.slice(-6)} exhausted. Rotating. Resets in ${retryAfterSec}s. ` +
    `${ALL_KEYS.length - exhaustedUntil.size} key(s) still available.`
  );
}

/** How many keys are currently healthy */
export function availableKeyCount(): number {
  const now = Date.now();
  return ALL_KEYS.filter((k) => (exhaustedUntil.get(k) ?? 0) <= now).length;
}

export const TOTAL_KEYS = ALL_KEYS.length;
