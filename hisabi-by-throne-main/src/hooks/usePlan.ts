import { useAuth, PLAN_LIMITS, type PlanType } from '@/contexts/AuthContext';

/**
 * Returns the current user's plan details and helpers for limit checking.
 */
export function usePlan() {
  const { plan, limits, userProfile, upgradePlan } = useAuth();

  const isPro = plan.type === 'pro';
  const isFree = plan.type === 'free';

  /** Check if a plan's expiry is still valid. */
  const isPlanActive = () => {
    if (!plan.expiresAt) return true; // lifetime / free plan
    return new Date(plan.expiresAt) > new Date();
  };

  const effectivePlan: PlanType = isPlanActive() ? plan.type : 'free';
  const effectiveLimits = PLAN_LIMITS[effectivePlan];

  return {
    plan,
    limits: effectiveLimits,
    isPro,
    isFree,
    isPlanActive: isPlanActive(),
    userProfile,
    upgradePlan,
  };
}

/**
 * Check if the user can add more products.
 */
export function useCanAddProduct(currentCount: number) {
  const { limits, isPro } = usePlan();
  const canAdd = currentCount < limits.maxProducts;
  const remaining = Math.max(0, limits.maxProducts - currentCount);
  return { canAdd, remaining, isPro };
}

/**
 * Check if the user can create more invoices this month.
 */
export function useCanAddInvoice(currentMonthCount: number) {
  const { limits, isPro } = usePlan();
  const canAdd = currentMonthCount < limits.maxMonthlyInvoices;
  const remaining = Math.max(
    0,
    limits.maxMonthlyInvoices - currentMonthCount
  );
  return { canAdd, remaining, isPro };
}

/**
 * Check if the user can add more suppliers.
 */
export function useCanAddSupplier(currentCount: number) {
  const { limits, isPro } = usePlan();
  const canAdd = currentCount < limits.maxSuppliers;
  const remaining = Math.max(0, limits.maxSuppliers - currentCount);
  return { canAdd, remaining, isPro, limit: limits.maxSuppliers };
}

/**
 * Check if the user can export reports.
 */
export function useCanExportReports() {
  const { limits, isPro } = usePlan();
  return { canExport: limits.canExportReports, isPro };
}

/**
 * Check if the user can use the Insights/business advisor feature.
 */
export function useCanUseInsights() {
  const { limits, isPro } = usePlan();
  return { canUse: limits.canUseInsights, isPro };
}

/**
 * Check if the user can view the "all time" period in reports.
 */
export function useCanViewAllPeriods() {
  const { limits, isPro } = usePlan();
  return { canView: limits.canViewAllPeriods, isPro };
}

/** Check if the user can compare two report periods side-by-side. */
export function useCanComparePeriods() {
  const { limits, isPro } = usePlan();
  return { canCompare: limits.canComparePeriods, isPro };
}

/** Check if the user can use the smart alerts page. */
export function useCanUseSmartAlerts() {
  const { limits, isPro } = usePlan();
  return { canUse: limits.canUseSmartAlerts, isPro };
}

/** Check if the user can view per-product profitability breakdown. */
export function useCanViewProductProfitability() {
  const { limits, isPro } = usePlan();
  return { canView: limits.canViewProductProfitability, isPro };
}

/** Check if the user can export the monthly financial summary as PDF. */
export function useCanExportMonthlySummary() {
  const { limits, isPro } = usePlan();
  return { canExport: limits.canExportMonthlySummary, isPro };
}
