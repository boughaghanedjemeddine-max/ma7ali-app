import { lazy, Suspense, memo, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { InstallPrompt } from "@/components/InstallPrompt";
import { OnlineGate } from "@/components/OnlineGate";
import { LicenseGate } from "@/components/LicenseGate";
import { useVisualViewport } from "@/hooks/useVisualViewport";
import { useAppLifecycle } from "@/hooks/useAppLifecycle";
import { BottomNav } from "@/components/BottomNav";
import { PageLoader } from "@/components/PageLoader";

// Always eager — tiny entry files
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Lazy-loaded pages (split into separate JS chunks)
const LoginScreen       = lazy(() => import("./pages/LoginScreen"));
const OnboardingScreen  = lazy(() => import("./pages/OnboardingScreen"));
const Dashboard         = lazy(() => import("./pages/Dashboard"));
const Stock             = lazy(() => import("./pages/Stock"));
const Sales             = lazy(() => import("./pages/Sales"));
const Invoices          = lazy(() => import("./pages/Invoices"));
const Settings          = lazy(() => import("./pages/Settings"));
const NewSale           = lazy(() => import("./pages/NewSale"));
const NewProduct        = lazy(() => import("./pages/NewProduct"));
const EditProduct       = lazy(() => import("./pages/EditProduct"));
const Expenses          = lazy(() => import("./pages/Expenses"));
const Credits           = lazy(() => import("./pages/Credits"));
const Customers         = lazy(() => import("./pages/Customers"));
const PrinterSettings   = lazy(() => import("./pages/PrinterSettings"));
const Reports           = lazy(() => import("./pages/Reports"));
const Suppliers             = lazy(() => import("./pages/Suppliers"));
const POS                   = lazy(() => import("./pages/POS"));
const ReceiptPreview        = lazy(() => import("./pages/ReceiptPreview"));
const Insights              = lazy(() => import("./pages/Insights"));
const SmartAlerts           = lazy(() => import("./pages/SmartAlerts"));
const ProductProfitability  = lazy(() => import("./pages/ProductProfitability"));
const Upgrade               = lazy(() => import("./pages/Upgrade"));
const Backup                = lazy(() => import("./pages/Backup"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,       // 5 min — skip redundant refetches
      gcTime: 1000 * 60 * 60,          // 60 min — keep cache warm longer
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: false,           // use cache instantly, refetch in background
      networkMode: 'offlineFirst',     // return cached data immediately, never block UI
      retry: (failureCount, error) => {
        if (error instanceof Error && error.message === 'User not authenticated') return false;
        return failureCount < 1;       // only 1 retry — fail fast
      },
    },
  },
});

/** Routes where bottom nav should NOT appear */
const NO_NAV_ROUTES = ['/', '/login', '/onboarding', '/sales/new', '/receipt-preview', '/upgrade'];

/** Prefetch the most-visited pages right after Dashboard loads */
function usePrefetchRoutes() {
  useEffect(() => {
    const timer = setTimeout(() => {
      import('./pages/Stock');
      import('./pages/Sales');
      import('./pages/Invoices');
      import('./pages/Expenses');
    }, 1500); // after first meaningful paint
    return () => clearTimeout(timer);
  }, []);
}

/** Layout: flex column — content scrolls, nav stays fixed at bottom */
const AppLayout = memo(function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  usePrefetchRoutes();
  const showNav = !NO_NAV_ROUTES.includes(location.pathname)
    && !location.pathname.startsWith('/stock/new')
    && !location.pathname.startsWith('/stock/edit');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
        {children}
      </div>
      {showNav && <BottomNav />}
    </div>
  );
});

/** Inner component so hooks can access BrowserRouter context */
const AppShell = memo(function AppShell({ children }: { children: React.ReactNode }) {
  useVisualViewport();    // viewport height → --app-height CSS var
  useAppLifecycle();      // wake lock + resume refresh
  return <>{children}</>;
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppShell>
    <LicenseGate>
    <AuthProvider>
      <TooltipProvider>
        <OnlineGate>
        <InstallPrompt />
        <Toaster />
        <Sonner position="top-center" />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Suspense fallback={<PageLoader />}>
          <AppLayout>
          <Routes>
            {/* Splash / entry point */}
            <Route path="/" element={<Index />} />

            {/* Auth routes (accessible without login) */}
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/onboarding" element={<OnboardingScreen />} />

            {/* Protected app routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/stock"
              element={
                <ProtectedRoute>
                  <Stock />
                </ProtectedRoute>
              }
            />
            <Route
              path="/stock/new"
              element={
                <ProtectedRoute>
                  <NewProduct />
                </ProtectedRoute>
              }
            />
            <Route
              path="/stock/edit/:id"
              element={
                <ProtectedRoute>
                  <EditProduct />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sales"
              element={
                <ProtectedRoute>
                  <Sales />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sales/new"
              element={
                <ProtectedRoute>
                  <NewSale />
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoices"
              element={
                <ProtectedRoute>
                  <Invoices />
                </ProtectedRoute>
              }
            />
            <Route
              path="/expenses"
              element={
                <ProtectedRoute>
                  <Expenses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/credits"
              element={
                <ProtectedRoute>
                  <Credits />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customers"
              element={
                <ProtectedRoute>
                  <Customers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/printer"
              element={
                <ProtectedRoute>
                  <PrinterSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/suppliers"
              element={
                <ProtectedRoute>
                  <Suppliers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pos"
              element={
                <ProtectedRoute>
                  <POS />
                </ProtectedRoute>
              }
            />
            <Route
              path="/receipt-preview"
              element={
                <ProtectedRoute>
                  <ReceiptPreview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/insights"
              element={
                <ProtectedRoute>
                  <Insights />
                </ProtectedRoute>
              }
            />
            <Route
              path="/smart-alerts"
              element={
                <ProtectedRoute>
                  <SmartAlerts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/product-profitability"
              element={
                <ProtectedRoute>
                  <ProductProfitability />
                </ProtectedRoute>
              }
            />
            <Route
              path="/upgrade"
              element={
                <ProtectedRoute>
                  <Upgrade />
                </ProtectedRoute>
              }
            />
            <Route
              path="/backup"
              element={
                <ProtectedRoute>
                  <Backup />
                </ProtectedRoute>
              }
            />
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </AppLayout>
          </Suspense>
        </BrowserRouter>
        </OnlineGate>
      </TooltipProvider>
    </AuthProvider>
    </LicenseGate>
    </AppShell>
  </QueryClientProvider>
);

export default App;
