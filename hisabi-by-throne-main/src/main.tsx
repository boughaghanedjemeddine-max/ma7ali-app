import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n"; // initialize i18next
import { requestNotificationPermission } from "./lib/notifications";
import { ErrorBoundary } from "./components/ErrorBoundary";

// ── Request persistent storage so Android never evicts IndexedDB ──────────────
// Without this, Android can silently clear app data under storage pressure,
// causing credits/sales/etc. to "disappear" after heavy phone usage.
if (navigator.storage?.persist) {
  navigator.storage.persist().catch(() => {/* ignore – not critical */});
}

// Request notification permission on first load (non-blocking)
requestNotificationPermission().catch(() => {/* ignore */});

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
