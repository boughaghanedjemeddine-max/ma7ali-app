/**
 * PageLoader.tsx
 * ──────────────
 * Shown by React Suspense while lazy-loaded page chunks are being fetched.
 * Keeps the brand consistent and avoids a jarring black flash.
 */

import { Loader2 } from 'lucide-react';

export function PageLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
      <div className="flex flex-col items-center gap-4">
        {/* Brand mark */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 flex items-center justify-center shadow-inner">
          <span className="text-2xl font-black bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent select-none">م</span>
        </div>

        {/* Spinner */}
        <Loader2 className="h-5 w-5 text-primary/60 animate-spin" />

        <span className="text-xs text-muted-foreground tracking-wider">جاري التحميل…</span>
      </div>
    </div>
  );
}
