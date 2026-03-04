import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { validateActivationCode, markCodeUsed } from '@/lib/activationCodes';

// ─── Local user shape ─────────────────────────────────────────────────────────
/** Mirrors the Firebase User fields used throughout the app. */
export interface LocalUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
}

const LOCAL_PROFILE_KEY = 'ma7ali-local-profile';

const LOCAL_MOCK_USER: LocalUser = {
  uid: 'local-user',
  email: '',
  displayName: 'متجري',
  photoURL: '',
};

// ─── Plan types ─────────────────────────────────────────────────────────────

export type PlanType = 'free' | 'pro';

export interface UserPlan {
  type: PlanType;
  expiresAt: string | null; // ISO string or null for lifetime
}

export interface PlanLimits {
  maxProducts: number;                  // 10 free / unlimited pro
  maxMonthlyInvoices: number;           // 50 free / unlimited pro
  maxSuppliers: number;                 // 3 free / unlimited pro
  canExportReports: boolean;            // false free / true pro
  canUseInsights: boolean;              // false free / true pro
  canViewAllPeriods: boolean;           // false free / true pro
  canComparePeriods: boolean;           // false free / true pro
  canUseSmartAlerts: boolean;           // false free / true pro
  canViewProductProfitability: boolean; // false free / true pro
  canExportMonthlySummary: boolean;     // false free / true pro
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    maxProducts: 10,
    maxMonthlyInvoices: 50,
    maxSuppliers: 3,
    canExportReports: false,
    canUseInsights: false,
    canViewAllPeriods: false,
    canComparePeriods: false,
    canUseSmartAlerts: false,
    canViewProductProfitability: false,
    canExportMonthlySummary: false,
  },
  pro: {
    maxProducts: Infinity,
    maxMonthlyInvoices: Infinity,
    maxSuppliers: Infinity,
    canExportReports: true,
    canUseInsights: true,
    canViewAllPeriods: true,
    canComparePeriods: true,
    canUseSmartAlerts: true,
    canViewProductProfitability: true,
    canExportMonthlySummary: true,
  },
};

// ─── UserProfile stored in Firestore ────────────────────────────────────────

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  plan: PlanType;
  planExpiresAt: string | null;
  onboardingCompleted: boolean;
  createdAt: string;
  lastLoginAt: string;
}

// ─── Context shape ──────────────────────────────────────────────────────────

interface AuthContextValue {
  user: LocalUser | null;
  userProfile: UserProfile | null;
  plan: UserPlan;
  limits: PlanLimits;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  upgradePlan: (type: PlanType, expiresAt?: string) => Promise<void>;
  activateCode: (code: string) => Promise<{ success: boolean; error?: string; durationLabel?: string }>;
  refreshProfile: () => Promise<void>;
}

// ─── Context creation ────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ───────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Derived plan values
  const plan: UserPlan = {
    type: userProfile?.plan ?? 'free',
    expiresAt: userProfile?.planExpiresAt ?? null,
  };
  const limits = PLAN_LIMITS[plan.type];

  // ── Load local profile from localStorage ───────────────────────────────
  useEffect(() => {
    const raw = localStorage.getItem(LOCAL_PROFILE_KEY);
    const profile: UserProfile = raw
      ? JSON.parse(raw)
      : {
          uid: 'local-user',
          email: '',
          displayName: 'متجري',
          photoURL: '',
          plan: 'free' as PlanType,
          planExpiresAt: null,
          onboardingCompleted: false,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
    if (!raw) localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
    setUser(LOCAL_MOCK_USER);
    setUserProfile(profile);
    setLoading(false);
  }, []);

  // ── Actions ─────────────────────────────────────────────────────────────

  const signInWithGoogle = async () => {
    // No-op in local/offline mode
  };

  const signOut = async () => {
    setUser(null);
    setUserProfile(null);
  };

  const completeOnboarding = async () => {
    const updated = { ...userProfile!, onboardingCompleted: true };
    setUserProfile(updated);
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(updated));
  };

  const upgradePlan = async (type: PlanType, expiresAt?: string) => {
    const updated = { ...userProfile!, plan: type, planExpiresAt: expiresAt ?? null };
    setUserProfile(updated);
    localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(updated));
  };

  const activateCode = async (code: string): Promise<{ success: boolean; error?: string; durationLabel?: string }> => {
    const result = validateActivationCode(code);
    if (!result.valid) return { success: false, error: result.error };
    markCodeUsed(code);
    await upgradePlan('pro', result.expiresAt ?? undefined);
    return { success: true, durationLabel: result.codeInfo?.label };
  };

  const refreshProfile = async () => {
    const raw = localStorage.getItem(LOCAL_PROFILE_KEY);
    if (raw) setUserProfile(JSON.parse(raw));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        plan,
        limits,
        loading,
        signInWithGoogle,
        signOut,
        completeOnboarding,
        upgradePlan,
        activateCode,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within <AuthProvider>');
  }
  return ctx;
}
