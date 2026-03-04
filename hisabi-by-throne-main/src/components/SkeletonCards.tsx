/**
 * SkeletonCards.tsx
 * ──────────────────
 * Reusable skeleton placeholders for every loading state in the app.
 * Replaces all "جاري التحميل..." text with animated skeleton UI.
 */

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/* ── Generic list item skeleton ─────────────────────────── */
export function SkeletonListItem({ className }: { className?: string }) {
  return (
    <div className={cn("bg-card border border-border/50 rounded-2xl p-4 space-y-3", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>
      <Skeleton className="h-3 w-full" />
    </div>
  );
}

/* ── Product card skeleton ───────────────────────────────── */
export function SkeletonProduct({ className }: { className?: string }) {
  return (
    <div className={cn("bg-card border border-border/50 rounded-2xl p-4 space-y-3", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/4" />
          <div className="flex gap-4 mt-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="text-right space-y-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

/* ── Stat card skeleton ──────────────────────────────────── */
export function SkeletonStatCard({ className }: { className?: string }) {
  return (
    <div className={cn("glass-card p-4 space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-7 w-28" />
    </div>
  );
}

/* ── Sale card skeleton ──────────────────────────────────── */
export function SkeletonSaleCard({ className }: { className?: string }) {
  return (
    <div className={cn("bg-card border border-border/50 rounded-2xl p-4 space-y-3", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="flex gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-12 rounded-full" />
          </div>
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="text-right space-y-1">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <div className="border-t border-border/30 pt-2 flex justify-end">
        <Skeleton className="h-7 w-7 rounded" />
      </div>
    </div>
  );
}

/* ── Invoice card skeleton ───────────────────────────────── */
export function SkeletonInvoiceCard({ className }: { className?: string }) {
  return (
    <div className={cn("glass-card p-4 space-y-3", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-14 rounded-full" />
          </div>
          <Skeleton className="h-4 w-28" />
          <div className="flex gap-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-7 w-7 rounded" />
        </div>
      </div>
      <div className="flex gap-2 border-t border-border/30 pt-3">
        <Skeleton className="h-8 flex-1 rounded-lg" />
        <Skeleton className="h-8 flex-1 rounded-lg" />
        <Skeleton className="h-8 flex-1 rounded-lg" />
      </div>
    </div>
  );
}

/* ── Dashboard hero skeleton ─────────────────────────────── */
export function SkeletonHero({ className }: { className?: string }) {
  return (
    <div className={cn("throne-card p-6 space-y-4", className)}>
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-12 w-40 mx-auto" />
      <div className="flex justify-center gap-6 pt-4 border-t border-border/30">
        <div className="text-center space-y-1">
          <Skeleton className="h-3 w-12 mx-auto" />
          <Skeleton className="h-6 w-20 mx-auto" />
        </div>
        <div className="text-center space-y-1">
          <Skeleton className="h-3 w-12 mx-auto" />
          <Skeleton className="h-6 w-16 mx-auto" />
        </div>
        <div className="text-center space-y-1">
          <Skeleton className="h-3 w-12 mx-auto" />
          <Skeleton className="h-6 w-20 mx-auto" />
        </div>
      </div>
    </div>
  );
}

/* ── Customer card skeleton ──────────────────────────────── */
export function SkeletonCustomer({ className }: { className?: string }) {
  return (
    <div className={cn("bg-card border border-border/50 rounded-2xl p-4", className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

/* ── Convenience: render N skeletons ─────────────────────── */
export function SkeletonList<T extends { className?: string }>({
  count = 5,
  Component,
}: {
  count?: number;
  Component: React.ComponentType<T>;
}) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} {...({} as T)} />
      ))}
    </div>
  );
}
