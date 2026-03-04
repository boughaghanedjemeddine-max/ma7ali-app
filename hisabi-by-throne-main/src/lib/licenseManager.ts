/**
 * licenseManager.ts
 * ──────────────────
 * Device-bound app license system for Ma7aLi.
 *
 * KEY FORMAT:  MA7A-XXXXX-XXXXX-XXXXX-XXXXX
 *              └── prefix ─┘└──── 20 data chars in 4 groups of 5 ────┘
 *
 * KEY STRUCTURE (12 bytes → 20 base32 chars):
 *   Byte  0    : version   (0x01)
 *   Byte  1    : tier      (0x01 = basic, 0x02 = pro)
 *   Bytes 2–4  : serial    (3 random bytes set by seller)
 *   Bytes 5–11 : auth-tag  (first 7 bytes of HMAC-SHA256(secret, deviceId+bytes[0..4]))
 *
 * DEVICE BINDING:
 *   The HMAC input includes the buyer's Device ID (32-hex fingerprint),
 *   so a key generated for device A will fail validation on device B.
 *
 * ALPHABET (32 unambiguous chars, no O/0/I/1):
 *   ABCDEFGHJKLMNPQRSTUVWXYZ23456789
 */

import { getCachedFingerprint } from './deviceFingerprint';

// ─── Fingerprint normalisation ────────────────────────────────────────────────
/**
 * The app computes a full 32-hex-char device fingerprint but only shows the
 * first 12 chars to the user (as MA7A-XXXX-XXXX-XXXX).
 * The keygen.html tool receives those 12 chars and pads them with zeros.
 * Both sides must produce the same 32-char HMAC input — this function handles that.
 */
export function normaliseFingerprint(fp: string): string {
  // Use only the first 12 hex chars (= what is displayed to the user), pad to 32
  return fp.slice(0, 12).toLowerCase().padEnd(32, '0');
}

// ─── Secret (split to resist trivial string search in compiled bundle) ────────
const _s1 = 'MA7a'; const _s2 = 'LiTH'; const _s3 = 'r0Ne';
const _s4 = 'K3Y!'; const _s5 = 'b4Se'; const _s6 = '2025';
const APP_SECRET = _s1 + _s2 + _s3 + _s4 + _s5 + _s6;  // 24 chars

// ─── Base32 alphabet ──────────────────────────────────────────────────────────
export const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// ─── Types ────────────────────────────────────────────────────────────────────
export type LicenseTier = 'basic' | 'pro';

export interface LicenseKey {
  version: number;
  tier: LicenseTier;
  serial: number;   // 3-byte value (0–16777215)
}

export interface StoredLicense {
  key: string;              // formatted key as-entered
  deviceFingerprint: string;
  tier: LicenseTier;
  serial: number;
  activatedAt: string;      // ISO date string
  integrity: string;        // HMAC over (key+fingerprint+activatedAt) — tamper detection
}

export interface LicenseStatus {
  valid: boolean;
  tier?: LicenseTier;
  activatedAt?: string;
  error?: string;
}

// ─── Storage key ─────────────────────────────────────────────────────────────
const LICENSE_STORAGE_KEY = 'ma7ali_license_v1';

// ─── HMAC helpers (Web Crypto API) ────────────────────────────────────────────

async function deriveHmacKey(secret: string): Promise<CryptoKey> {
  const keyData = new TextEncoder().encode(secret);
  return crypto.subtle.importKey(
    'raw', keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

async function hmacSha256(secret: string, message: string): Promise<Uint8Array> {
  const key = await deriveHmacKey(secret);
  const data = new TextEncoder().encode(message);
  const sig = await crypto.subtle.sign('HMAC', key, data);
  return new Uint8Array(sig);
}

// ─── Encoding ─────────────────────────────────────────────────────────────────

/**
 * Encodes 12 bytes into 20 characters using the 32-char alphabet.
 * Uses streaming 5-bit groups — no BigInt required.
 *
 * 12 bytes × 8 bits = 96 bits → 19 full 5-bit groups + 1 remaining bit
 * padded to produce exactly 20 chars.
 */
export function encodeKey(bytes: Uint8Array): string {
  const chars: string[] = [];
  let buffer = 0;        // holds up to 12 bits safely
  let bitsInBuffer = 0;

  for (const byte of bytes) {
    buffer = ((buffer << 8) | byte) & 0xFFFF; // keep at most 16 bits
    bitsInBuffer += 8;
    while (bitsInBuffer >= 5) {
      bitsInBuffer -= 5;
      chars.push(ALPHABET[(buffer >> bitsInBuffer) & 0x1F]);
    }
  }
  // Flush remaining bits (pad with zeros on the right)
  if (bitsInBuffer > 0) {
    chars.push(ALPHABET[(buffer << (5 - bitsInBuffer)) & 0x1F]);
  }
  return chars.join('');
}

/**
 * Decodes 20 characters back to 12 bytes.
 * Returns null if any character is invalid.
 *
 * 20 chars × 5 bits = 100 bits → 12 full bytes (96 bits) + 4 trailing padding bits.
 */
export function decodeKey(encoded: string): Uint8Array | null {
  if (encoded.length !== 20) return null;
  const upper = encoded.toUpperCase();

  const bytes = new Uint8Array(12);
  let buffer = 0;
  let bitsInBuffer = 0;
  let byteIndex = 0;

  for (const ch of upper) {
    const idx = ALPHABET.indexOf(ch);
    if (idx === -1) return null;
    buffer = ((buffer << 5) | idx) & 0xFFFF;
    bitsInBuffer += 5;
    if (bitsInBuffer >= 8) {
      bitsInBuffer -= 8;
      if (byteIndex >= 12) return null; // more data than expected
      bytes[byteIndex++] = (buffer >> bitsInBuffer) & 0xFF;
    }
  }

  if (byteIndex !== 12) return null;
  return bytes;
}

// ─── Key formatting ───────────────────────────────────────────────────────────

/** Formats 20-char raw key string as MA7A-XXXXX-XXXXX-XXXXX-XXXXX */
export function formatKey(raw20: string): string {
  const u = raw20.toUpperCase();
  return `MA7A-${u.slice(0,5)}-${u.slice(5,10)}-${u.slice(10,15)}-${u.slice(15,20)}`;
}

/** Strips MA7A- prefix and all dashes, returns 20 raw chars or null */
export function stripKey(formatted: string): string | null {
  const cleaned = formatted.toUpperCase().replace(/[\s\-]/g, '');
  const withoutPrefix = cleaned.startsWith('MA7A') ? cleaned.slice(4) : cleaned;
  if (withoutPrefix.length !== 20) return null;
  return withoutPrefix;
}

// ─── Key generation (used ONLY in keygen.html tool, exported here for reference) ──
/**
 * Generates a device-bound license key for the given Device ID.
 * This function is INTENTIONALLY duplicated in keygen.html (which is never
 * bundled in the app APK).
 */
export async function generateKey(
  deviceFingerprint: string,   // 32-hex string from getDeviceFingerprint()
  tier: LicenseTier,
  serialBytes?: [number, number, number]
): Promise<string> {
  const serial = serialBytes ?? [
    Math.floor(Math.random() * 256),
    Math.floor(Math.random() * 256),
    Math.floor(Math.random() * 256),
  ];

  const payload = new Uint8Array([
    0x01,                          // version
    tier === 'pro' ? 0x02 : 0x01, // tier
    ...serial,                     // 3 bytes
  ]); // 5 bytes

  // HMAC input: normalised fingerprint (32 chars, same 12-char prefix padded with zeros) + payload bytes as hex
  const normFp = normaliseFingerprint(deviceFingerprint);
  const hmacInput =
    normFp +
    Array.from(payload).map(b => b.toString(16).padStart(2, '0')).join('');

  const authTag = await hmacSha256(APP_SECRET, hmacInput);

  const keyBytes = new Uint8Array(12);
  keyBytes.set(payload);          // bytes 0–4
  keyBytes.set(authTag.slice(0, 7), 5); // bytes 5–11

  return formatKey(encodeKey(keyBytes));
}

// ─── Validation ───────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  tier?: LicenseTier;
  serial?: number;
  error?: string;
}

/**
 * Validates a license key against this device's fingerprint.
 * Does NOT write to storage — call activateLicense() to persist.
 */
export async function validateKey(
  formattedKey: string,
  deviceFingerprint?: string
): Promise<ValidationResult> {
  const raw = stripKey(formattedKey);
  if (!raw) {
    return { valid: false, error: 'صيغة المفتاح غير صحيحة' };
  }

  const keyBytes = decodeKey(raw);
  if (!keyBytes) {
    return { valid: false, error: 'المفتاح يحتوي على أحرف غير صالحة' };
  }

  const version = keyBytes[0];
  if (version !== 0x01) {
    return { valid: false, error: 'إصدار المفتاح غير مدعوم' };
  }

  const tierByte = keyBytes[1];
  const tier: LicenseTier = tierByte === 0x02 ? 'pro' : 'basic';
  const serial = (keyBytes[2] << 16) | (keyBytes[3] << 8) | keyBytes[4];

  const rawFp = deviceFingerprint ?? (await getCachedFingerprint());
  const fp = normaliseFingerprint(rawFp);

  // Re-derive expected auth tag
  const payload = keyBytes.slice(0, 5);
  const hmacInput =
    fp +
    Array.from(payload).map(b => b.toString(16).padStart(2, '0')).join('');

  const expectedTag = await hmacSha256(APP_SECRET, hmacInput);

  // Compare first 7 bytes
  const embeddedTag = keyBytes.slice(5, 12);
  for (let i = 0; i < 7; i++) {
    if (embeddedTag[i] !== expectedTag[i]) {
      return { valid: false, error: 'المفتاح غير صالح لهذا الجهاز' };
    }
  }

  return { valid: true, tier, serial };
}

// ─── Storage (localStorage) ──────────────────────────────────────────────────
// localStorage is always available — even before IndexedDB is initialised,
// which is critical because ActivationScreen renders before the app DB opens.

async function readStoredLicense(): Promise<StoredLicense | null> {
  try {
    const raw = localStorage.getItem(LICENSE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredLicense;
  } catch {
    return null;
  }
}

async function writeStoredLicense(license: StoredLicense): Promise<void> {
  localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(license));
}

/** Computes a tamper-detection HMAC for the stored license record */
async function computeIntegrity(license: Omit<StoredLicense, 'integrity'>): Promise<string> {
  const msg = `${license.key}|${license.deviceFingerprint}|${license.activatedAt}|${license.tier}|${license.serial}`;
  const tag = await hmacSha256(APP_SECRET + '_integrity', msg);
  return Array.from(tag.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Validates the key, then persists the license bound to this device.
 * Returns the same ValidationResult so the UI can react.
 */
export async function activateLicense(formattedKey: string): Promise<ValidationResult> {
  const rawFp = await getCachedFingerprint();
  const fp = normaliseFingerprint(rawFp);
  const result = await validateKey(formattedKey, fp);
  if (!result.valid) return result;

  const now = new Date().toISOString();
  const partial: Omit<StoredLicense, 'integrity'> = {
    key: formattedKey.toUpperCase().replace(/[\s]/g, '').replace(/(?<=[A-Z0-9]{4})-(?=[A-Z0-9])/g, '-'),
    deviceFingerprint: fp,
    tier: result.tier!,
    serial: result.serial!,
    activatedAt: now,
  };
  const integrity = await computeIntegrity(partial);
  await writeStoredLicense({ ...partial, integrity });

  return result;
}

/**
 * Checks whether a valid, device-bound license is stored.
 * - Reads from IndexedDB
 * - Verifies integrity HMAC (tamper detection)
 * - Verifies key is still valid for this device
 */
export async function checkLicense(): Promise<LicenseStatus> {
  try {
    const stored = await readStoredLicense();
    if (!stored) {
      return { valid: false, error: 'لا يوجد ترخيص' };
    }

    // 1. Verify integrity (tamper detection)
    const { integrity, ...rest } = stored;
    const expectedIntegrity = await computeIntegrity(rest);
    if (integrity !== expectedIntegrity) {
      return { valid: false, error: 'تم العبث ببيانات الترخيص' };
    }

    // 2. Verify device fingerprint matches current device
    const rawFp = await getCachedFingerprint();
    const fp = normaliseFingerprint(rawFp);
    if (stored.deviceFingerprint !== fp) {
      return { valid: false, error: 'هذا الترخيص غير صالح لهذا الجهاز' };
    }

    // 3. Re-validate the key itself
    const keyCheck = await validateKey(stored.key, fp);
    if (!keyCheck.valid) {
      return { valid: false, error: keyCheck.error };
    }

    return {
      valid: true,
      tier: stored.tier,
      activatedAt: stored.activatedAt,
    };
  } catch (err) {
    console.error('[LicenseManager] checkLicense error:', err);
    return { valid: false, error: 'خطأ في التحقق من الترخيص' };
  }
}

/**
 * Returns stored license metadata (without re-validating).
 * Returns null if no license is stored.
 */
export async function getLicenseInfo(): Promise<StoredLicense | null> {
  return readStoredLicense();
}

/**
 * Removes the stored license (for testing / device reset).
 */
export async function revokeLicense(): Promise<void> {
  localStorage.removeItem(LICENSE_STORAGE_KEY);
}
