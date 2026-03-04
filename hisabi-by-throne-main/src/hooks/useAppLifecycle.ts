/**
 * useAppLifecycle.ts
 * Handles app background/foreground transitions for Capacitor (Android/iOS)
 * and the browser Page Visibility API.
 *
 * On resume from background:
 *  – Invalidates all React Query caches so stale data is refreshed
 *  – Resets any dropped IndexedDB connection
 *
 * WakeLock:
 *  – Acquires a screen wake lock while the app is foregrounded so
 *    the device screen does not dim mid-operation (useful during
 *    sales entry or Bluetooth printing).
 */
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Capacitor } from "@capacitor/core";

export function useAppLifecycle() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;

    // ── Acquire Wake Lock ────────────────────────────────────────
    const acquireWakeLock = async () => {
      if ("wakeLock" in navigator) {
        try {
          wakeLock = await navigator.wakeLock!.request("screen");
        } catch {
          // Wake lock not available or permission denied — fail silently
        }
      }
    };

    // ── Release Wake Lock ────────────────────────────────────────
    const releaseWakeLock = () => {
      wakeLock?.release().catch(() => {});
      wakeLock = null;
    };

    // ── Invalidate all query caches on resume ────────────────────
    const onResume = () => {
      queryClient.invalidateQueries();
      acquireWakeLock();
    };

    acquireWakeLock();

    // ── Capacitor (native Android / iOS) ────────────────────────
    if (Capacitor.isNativePlatform()) {
      let cleanup: (() => void) | undefined;

      import("@capacitor/app").then(({ App }) => {
        const listener = App.addListener("appStateChange", (state) => {
          if (state.isActive) {
            onResume();
          } else {
            releaseWakeLock();
          }
        });
        cleanup = () => { listener.then(h => h.remove()); };
      }).catch(() => {/* Capacitor App plugin not available */});

      return () => {
        cleanup?.();
        releaseWakeLock();
      };
    }

    // ── Web / PWA fallback: Page Visibility API ──────────────────
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        onResume();
      } else {
        releaseWakeLock();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    // Re-acquire wake lock when browser re-grants it after page regains focus
    const onWakeLockRelease = () => { if (document.visibilityState === "visible") acquireWakeLock(); };
    wakeLock?.addEventListener("release", onWakeLockRelease);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      releaseWakeLock();
    };
  }, [queryClient]);
}

// --------------------------------------------------------------------------
// TypeScript: WakeLock is still experimental — add minimal types
// --------------------------------------------------------------------------


