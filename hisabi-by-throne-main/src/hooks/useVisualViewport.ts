/**
 * useVisualViewport.ts
 * Tracks the visible screen area and writes --app-height CSS variable.
 * This prevents the app from going "half-screen" when the Android
 * virtual keyboard opens, since the keyboard shrinks the visual viewport
 * but not the layout viewport used by `100vh`.
 *
 * Must be called once at the root level (inside App or main.tsx).
 */
import { useEffect } from "react";

export function useVisualViewport() {
  useEffect(() => {
    const setHeight = () => {
      const h = window.visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty("--app-height", `${h}px`);
    };

    setHeight();

    // The visualViewport API is the most precise signal for keyboard open/close
    window.visualViewport?.addEventListener("resize", setHeight);
    window.visualViewport?.addEventListener("scroll", setHeight);

    // Fallback for browsers without visualViewport
    window.addEventListener("resize", setHeight);

    return () => {
      window.visualViewport?.removeEventListener("resize", setHeight);
      window.visualViewport?.removeEventListener("scroll", setHeight);
      window.removeEventListener("resize", setHeight);
    };
  }, []);
}
