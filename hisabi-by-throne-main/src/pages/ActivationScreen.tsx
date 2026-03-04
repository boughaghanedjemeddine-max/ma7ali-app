/**
 * ActivationScreen.tsx
 * ─────────────────────
 * Full-screen license activation UI.
 *
 * Flow:
 *  1. App shows this screen when no valid license is found.
 *  2. Screen computes a stable Device ID from browser/hardware signals.
 *  3. User sends the Device ID to the seller.
 *  4. Seller opens keygen.html, enters the Device ID → generates a license key.
 *  5. User enters the key → app verifies HMAC against Device ID → unlocks.
 *
 * The Device ID is device-bound (userAgent + screen + timezone + hardware),
 * NOT network-bound — it stays the same regardless of WiFi/IP changes.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Shield, Key, Copy, Check, Loader2, AlertCircle, Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getCachedFingerprint, getShortDeviceId } from '@/lib/deviceFingerprint';
import { activateLicense } from '@/lib/licenseManager';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ActivationScreenProps {
  onSuccess: () => void;
}

// ─── Auto-format key input ────────────────────────────────────────────────────

function autoFormatKey(raw: string): string {
  const stripped = raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 24); // MA7A(4) + 20 data chars

  let prefix = '';
  let data = stripped;

  if (data.startsWith('MA7A')) {
    prefix = 'MA7A';
    data = data.slice(4);
  } else {
    if (stripped.length < 4) return stripped;
    prefix = 'MA7A';
    data = stripped.slice(0, 20);
  }

  const groups: string[] = [];
  for (let i = 0; i < data.length; i += 5) groups.push(data.slice(i, i + 5));
  const dataPart = groups.join('-');
  return dataPart ? `${prefix}-${dataPart}` : prefix;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ActivationScreen({ onSuccess }: ActivationScreenProps) {
  const [deviceId, setDeviceId]       = useState<string | null>(null);
  const [keyInput, setKeyInput]       = useState('');
  const [copied, setCopied]           = useState(false);
  const [activating, setActivating]   = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [success, setSuccess]         = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Compute Device ID on mount (pure computation, always succeeds) ─────────
  useEffect(() => {
    getCachedFingerprint().then(fp => {
      setDeviceId(getShortDeviceId(fp));
    });
  }, []);

  // ── Copy Device ID ─────────────────────────────────────────────────────────
  const handleCopy = useCallback(async () => {
    if (!deviceId) return;
    try {
      await navigator.clipboard.writeText(deviceId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }, [deviceId]);

  // ── Key input ──────────────────────────────────────────────────────────────
  const handleKeyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyInput(autoFormatKey(e.target.value));
    setError(null);
  }, []);

  // ── Activate ───────────────────────────────────────────────────────────────
  const handleActivate = useCallback(async () => {
    if (keyInput.replace(/[^A-Z0-9]/g, '').length < 24) {
      setError('الرجاء إدخال المفتاح كاملاً (MA7A-XXXXX-XXXXX-XXXXX-XXXXX)');
      return;
    }
    setActivating(true);
    setError(null);
    try {
      const result = await activateLicense(keyInput);
      if (result.valid) {
        setSuccess(true);
        setTimeout(() => onSuccess(), 1200);
      } else {
        setError(result.error ?? 'المفتاح غير صالح');
      }
    } catch (err) {
      setError('حدث خطأ أثناء التحقق. حاول مجدداً.');
      console.error('[ActivationScreen]', err);
    } finally {
      setActivating(false);
    }
  }, [keyInput, onSuccess]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleActivate();
  }, [handleActivate]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      dir="rtl"
      className="fixed inset-0 flex flex-col items-center justify-center bg-background overflow-y-auto"
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-accent/8 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm mx-auto px-5 py-8 flex flex-col gap-7">

        {/* ── Header icon + title ── */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className={cn(
            'flex items-center justify-center w-16 h-16 rounded-2xl transition-all duration-500',
            'bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/30',
            success && 'from-success to-success/60 shadow-success/30 scale-110'
          )}>
            {success
              ? <Check className="w-8 h-8 text-white" />
              : <Shield className="w-8 h-8 text-white" />
            }
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {success ? 'تم تفعيل التطبيق!' : 'تفعيل التطبيق'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {success
                ? 'مرحباً بك. يتم فتح التطبيق الآن…'
                : 'هذا التطبيق مرخَّص. أرسل معرّف الجهاز إلى البائع لتستلم مفتاح التفعيل.'
              }
            </p>
          </div>
        </div>

        {/* ── Device ID Card ── */}
        <div className="rounded-2xl bg-card border border-border p-4 flex flex-col gap-3">
          {/* Header row */}
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wide">
            <Smartphone className="w-3.5 h-3.5" />
            <span>معرّف الجهاز</span>
          </div>

          {/* Loading state */}
          {!deviceId && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm py-1">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>جاري تحديد الجهاز…</span>
            </div>
          )}

          {/* Device ID ready */}
          {deviceId && (
            <>
              <div className="flex items-center justify-between gap-3">
                <span
                  dir="ltr"
                  className="font-mono text-lg font-bold text-foreground tracking-widest select-all"
                >
                  {deviceId}
                </span>
                <button
                  onClick={handleCopy}
                  title="نسخ"
                  className={cn(
                    'flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-all border font-medium shrink-0',
                    copied
                      ? 'border-success/40 bg-success/10 text-success'
                      : 'border-border bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'تم النسخ' : 'نسخ'}
                </button>
              </div>
              <p className="text-xs text-muted-foreground/70 leading-relaxed">
                أرسل هذا المعرّف إلى البائع ليولّد لك مفتاح التفعيل الخاص بجهازك.
              </p>
            </>
          )}
        </div>

        {/* ── Key Input ── */}
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <Key className="w-3.5 h-3.5" />
            مفتاح التفعيل
          </label>

          <Input
            ref={inputRef}
            dir="ltr"
            placeholder="MA7A-XXXXX-XXXXX-XXXXX-XXXXX"
            value={keyInput}
            onChange={handleKeyChange}
            onKeyDown={handleKeyDown}
            disabled={activating || success}
            maxLength={29}
            className={cn(
              'text-center font-mono text-sm tracking-widest h-12',
              'bg-card border-border focus-visible:ring-primary/50',
              error && 'border-destructive/70 focus-visible:ring-destructive/30',
              success && 'border-success/50'
            )}
            autoCapitalize="characters"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />

          {error && (
            <div className="flex items-start gap-2 text-destructive text-xs bg-destructive/10 border border-destructive/20 rounded-xl px-3 py-2.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* ── Activate Button ── */}
        <Button
          onClick={handleActivate}
          disabled={activating || success || !keyInput || !deviceId}
          size="lg"
          className={cn(
            'w-full h-12 text-base font-semibold rounded-xl transition-all duration-300',
            'bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70',
            'shadow-lg shadow-primary/20',
            success && 'from-success to-success/80 shadow-success/20'
          )}
        >
          {activating ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : success ? (
            <><Check className="w-5 h-5 mr-2" />جاري التفعيل…</>
          ) : (
            'تفعيل التطبيق'
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground/60 leading-relaxed">
          المفتاح مرتبط بهذا الجهاز فقط ولا يعمل على جهاز آخر.
        </p>

      </div>
    </div>
  );
}

