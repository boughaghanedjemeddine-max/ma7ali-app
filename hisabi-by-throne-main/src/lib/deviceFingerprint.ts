/**
 * deviceFingerprint.ts
 * ─────────────────────
 * Generates and persists a STABLE random install ID for this device.
 *
 * How it works:
 *   • First launch: 6 random bytes → 12 hex chars → saved in localStorage forever.
 *   • Every subsequent launch: reads the saved value — ID NEVER changes.
 *   • Shown to user as: MA7A-XXXX-XXXX-XXXX
 *   • Seller enters this ID in keygen.html → generates a license key bound to it.
 *
 * Why NOT device-signal hashing:
 *   Device signals (userAgent, screen, timezone…) can shift with OS updates or
 *   when the virtual keyboard appears — causing the ID to change unexpectedly.
 *   A saved random ID is 100% stable for the lifetime of the app installation.
 */

const INSTALL_ID_KEY = 'ma7ali_install_id_v1';

// ─── Install ID ───────────────────────────────────────────────────────────────

/** Generates a fresh 12-char random hex string (6 bytes). */
function generateInstallId(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Returns the install ID for this device.
 * Creates and persists one on first call; returns the same value forever after.
 */
export function getInstallId(): string {
  try {
    const stored = localStorage.getItem(INSTALL_ID_KEY);
    if (stored && /^[0-9a-f]{12}$/.test(stored)) return stored;
  } catch { /* localStorage unavailable — fall through */ }

  const id = generateInstallId();

  try { localStorage.setItem(INSTALL_ID_KEY, id); } catch { /* ignore */ }
  return id;
}

/**
 * Returns the short, user-facing Device ID shown on the Activation screen.
 * Format: MA7A-XXXX-XXXX-XXXX  (12 hex chars in 3 groups of 4)
 * This is what the user copies and sends to the seller.
 */
export function getShortDeviceId(installId: string): string {
  const upper = installId.slice(0, 12).toUpperCase();
  return `MA7A-${upper.slice(0, 4)}-${upper.slice(4, 8)}-${upper.slice(8, 12)}`;
}

// ─── Compatibility shim (used by licenseManager.ts) ──────────────────────────

let _cache: string | null = null;

/**
 * Async wrapper around getInstallId() — kept for compatibility with licenseManager.
 * Returns the 12-char install ID (synchronously, wrapped in a resolved promise).
 */
export async function getCachedFingerprint(): Promise<string> {
  if (!_cache) _cache = getInstallId();
  return _cache;
}
