/**
 * LicenseGate.tsx
 * ────────────────
 * Wraps the entire app. Blocks access until a valid device-bound license
 * is found in IndexedDB.
 *
 * States:
 *  'checking'  → splash-style loading (first ~300 ms)
 *  'invalid'   → shows ActivationScreen
 *  'valid'     → renders children normally
 */

import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { checkLicense } from '@/lib/licenseManager';

// Lazy-load so it's code-split and doesn't bloat the main bundle
const ActivationScreen = lazy(() => import('@/pages/ActivationScreen'));

// ─── Types ────────────────────────────────────────────────────────────────────

type GateState = 'checking' | 'valid' | 'invalid';

interface LicenseGateProps {
  children: React.ReactNode;
}

// ─── Loading UI ───────────────────────────────────────────────────────────────

function LicenseChecking() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 text-primary/40 animate-spin" />
    </div>
  );
}

// ─── Gate Component ───────────────────────────────────────────────────────────

export function LicenseGate({ children }: LicenseGateProps) {
  const [state, setState] = useState<GateState>('checking');

  const verify = useCallback(async () => {
    try {
      const status = await checkLicense();
      setState(status.valid ? 'valid' : 'invalid');
    } catch {
      setState('invalid');
    }
  }, []);

  useEffect(() => {
    verify();
  }, [verify]);

  if (state === 'checking') {
    return <LicenseChecking />;
  }

  if (state === 'invalid') {
    return (
      <Suspense fallback={<LicenseChecking />}>
        <ActivationScreen onSuccess={() => setState('valid')} />
      </Suspense>
    );
  }

  // License valid — render the actual app
  return <>{children}</>;
}
