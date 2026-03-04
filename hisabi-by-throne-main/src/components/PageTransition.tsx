/**
 * PageTransition.tsx
 * Wraps each page with a fast fade animation on route change.
 * Uses opacity-only animation (no transform) to avoid layout disruption.
 */
import { useLocation } from "react-router-dom";
import { memo } from "react";

interface Props {
  children: React.ReactNode;
}

export const PageTransition = memo(function PageTransition({ children }: Props) {
  const { pathname } = useLocation();
  // Wrap with a layout-neutral block. The key causes React to remount
  // the div (triggering the CSS animation) on every route change.
  return (
    <div
      key={pathname}
      className="page-enter"
      style={{ isolation: "isolate" }}
    >
      {children}
    </div>
  );
});
