/**
 * activationCodes.ts
 * Offline activation-code engine for Ma7aLi Pro.
 * Code format: THRONE-XXXX-XXXX-XXXX
 * Type keys: M1=1mo  M3=3mo  M6=6mo  Y1=1yr  LF=lifetime
 * Device-lock: each code is bound to the first device that activates it.
 */

const ACTIVATION_SALT = 'MA7ALI$THRONE$2026$PRO';
const USED_CODES_KEY  = 'ma7ali-activated-codes';
const DEVICE_ID_KEY   = 'ma7ali-device-id';

function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = 'DEV-' + Math.random().toString(36).slice(2, 10).toUpperCase()
              + '-' + Date.now().toString(36).toUpperCase();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export interface CodeInfo {
  label: string;
  months: number | null;
}

const DURATION_MAP: Record<string, CodeInfo> = {
  M1: { label: 'شهر واحد',   months: 1  },
  M3: { label: '٣ أشهر',     months: 3  },
  M6: { label: '٦ أشهر',     months: 6  },
  Y1: { label: 'سنة كاملة',  months: 12 },
  LF: { label: 'مدى الحياة', months: null },
};

function djb2(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (((h << 5) + h) ^ str.charCodeAt(i)) >>> 0;
  }
  return h;
}

function computeCheck(payload8: string): string {
  const hash = djb2(payload8.toUpperCase() + ACTIVATION_SALT);
  return hash.toString(36).toUpperCase().padStart(6, '0').slice(0, 4);
}

export function normaliseCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[\s\-]/g, '').replace(/^THRONE/, 'THRONE-');
}

function toCanonical(raw: string): string {
  const clean = raw.trim().toUpperCase().replace(/\s/g, '');
  if (/^THRONE-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(clean)) return clean;
  const stripped = clean.replace(/-/g, '');
  if (stripped.startsWith('THRONE') && stripped.length === 18) {
    const body = stripped.slice(6);
    return `THRONE-${body.slice(0,4)}-${body.slice(4,8)}-${body.slice(8,12)}`;
  }
  return clean;
}

type UsedCodesMap = Record<string, string>;

function getUsedCodes(): UsedCodesMap {
  try { return JSON.parse(localStorage.getItem(USED_CODES_KEY) || '{}'); }
  catch { return {}; }
}

export function markCodeUsed(raw: string): void {
  const canonical = toCanonical(raw);
  const map = getUsedCodes();
  if (!map[canonical]) {
    map[canonical] = getDeviceId();
    localStorage.setItem(USED_CODES_KEY, JSON.stringify(map));
  }
}

export function isCodeUsed(raw: string): boolean {
  const canonical = toCanonical(raw);
  const map = getUsedCodes();
  if (!(canonical in map)) return false;
  return map[canonical] !== getDeviceId();
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  codeInfo?: CodeInfo;
  expiresAt: string | null;
}

export function validateActivationCode(raw: string): ValidationResult {
  const canonical = toCanonical(raw);
  const match = canonical.match(/^THRONE-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})$/);
  if (!match) return { valid: false, error: 'صيغة الكود غير صحيحة — المطلوب: THRONE-XXXX-XXXX-XXXX', expiresAt: null };

  const [, p1, p2, check] = match;
  const payload = p1 + p2;
  const typeKey = payload.slice(0, 2);

  if (computeCheck(payload) !== check) return { valid: false, error: 'الكود غير صحيح أو تالف', expiresAt: null };

  const codeInfo = DURATION_MAP[typeKey];
  if (!codeInfo) return { valid: false, error: 'نوع الكود غير معروف', expiresAt: null };

  if (isCodeUsed(canonical)) return { valid: false, error: 'هذا الكود مُفعَّل مسبقاً على جهاز آخر', expiresAt: null };

  let expiresAt: string | null = null;
  if (codeInfo.months !== null) {
    const exp = new Date();
    exp.setMonth(exp.getMonth() + codeInfo.months);
    expiresAt = exp.toISOString();
  }
  return { valid: true, codeInfo, expiresAt };
}

export function generateCode(typeKey: keyof typeof DURATION_MAP, sequence: string): string {
  const seq = sequence.toUpperCase().replace(/[^A-Z0-9]/g, '').padEnd(6, '0').slice(0, 6);
  const payload = (typeKey + seq).slice(0, 8).padEnd(8, '0');
  const check = computeCheck(payload);
  return `THRONE-${payload.slice(0,4)}-${payload.slice(4,8)}-${check}`;
}

export function generateBatch(typeKey: keyof typeof DURATION_MAP, count: number, startIndex = 1): string[] {
  return Array.from({ length: count }, (_, i) =>
    generateCode(typeKey, String(startIndex + i).padStart(6, '0'))
  );
}
