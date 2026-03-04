import { useState } from "react";
import { NavLink, useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Package,
  Zap,
  ShoppingCart,
  Settings,
  Receipt,
  Wallet,
  TrendingUp,
  Users,
  Truck,
  CreditCard,
  X,
  Menu,
  Bell,
  BarChart3,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── 5 main nav items (السلة in the center) ── */
const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, labelKey: "nav.dashboard" },
  { to: "/stock",     icon: Package,         labelKey: "nav.stock" },
  { to: "/pos",       icon: Zap,             labelKey: "nav.cart",    center: true },
  { to: "/sales",     icon: ShoppingCart,     labelKey: "nav.sales" },
  { to: "/settings",  icon: Settings,         labelKey: "nav.settings" },
];

/* ── Extra pages accessible from the drawer ── */
const drawerItems = [
  { to: "/reports",               icon: TrendingUp,  labelKey: "nav.reports" },
  { to: "/insights",             icon: Zap,         labelKey: "nav.insights",            pro: true },
  { to: "/smart-alerts",         icon: Bell,        labelKey: "nav.smartAlerts",          pro: true },
  { to: "/product-profitability",icon: BarChart3,   labelKey: "nav.productProfitability", pro: true },
  { to: "/credits",              icon: CreditCard,  labelKey: "nav.credits" },
  { to: "/customers",            icon: Users,       labelKey: "nav.customers" },
  { to: "/suppliers",            icon: Truck,       labelKey: "nav.suppliers" },
  { to: "/invoices",             icon: Receipt,     labelKey: "nav.invoices" },
  { to: "/expenses",             icon: Wallet,      labelKey: "nav.expenses" },
  { to: "/upgrade",              icon: Crown,       labelKey: "nav.upgrade" },
];

/* ── Drawer (exported so Dashboard header can use it too) ── */
export function MoreDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  if (!open) return null;
  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 z-[70] bg-card rounded-t-3xl safe-bottom pb-8 animate-slide-up">
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>
        <div className="flex items-center justify-between px-4 pb-4">
          <h2 className="text-base font-bold text-foreground">{t('nav.fullMenu')}</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3 px-4">
          {drawerItems.map((item) => {
            const Icon = item.icon;
            const isPro = (item as { pro?: boolean }).pro;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                className="relative flex flex-col items-center gap-2 bg-muted/50 rounded-2xl p-4 hover:bg-accent/10 transition-colors active:scale-95"
              >
                {isPro && (
                  <span className="absolute top-1.5 left-1.5 flex items-center gap-0.5 text-[8px] font-bold text-amber-500 bg-amber-500/10 px-1 py-0.5 rounded-full leading-none">
                    <Crown className="h-2 w-2" />Pro
                  </span>
                )}
                <Icon className={cn('h-6 w-6', isPro ? 'text-amber-500' : 'text-accent')} />
                <span className="text-xs font-medium text-foreground text-center leading-tight">
                  {t(item.labelKey)}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* ── Bottom Navigation Bar ── */
export function BottomNav() {
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <nav
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 8px)',
        flexShrink: 0,
      }}
    >
      {/* Glass pill container */}
      <div
        className="mx-3 mb-2 mt-1 rounded-[32px] overflow-visible"
        style={{
          /* layered glass effect */
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
          backdropFilter: 'blur(32px) saturate(180%)',
          WebkitBackdropFilter: 'blur(32px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow:
            '0 8px 32px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.1)',
        }}
      >
        {/* inner top-shine streak */}
        <div
          className="absolute inset-x-8 top-0 h-px rounded-full pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)' }}
        />

        <div className="flex items-center justify-around py-2 px-2">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.to ||
              (item.to === "/dashboard" && location.pathname === "/");
            const Icon = item.icon;

            /* ── Center floating action button ── */
            if (item.center) {
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="relative flex flex-col items-center -mt-7 group"
                >
                  {/* outer glow ring */}
                  <div
                    className="absolute -inset-1.5 rounded-[22px] blur-xl opacity-60 transition-all duration-500 group-active:opacity-90"
                    style={{
                      background: isActive
                        ? 'radial-gradient(ellipse, hsl(var(--accent)/0.7), transparent)'
                        : 'radial-gradient(ellipse, rgba(251,191,36,0.6), rgba(245,158,11,0.3), transparent)',
                    }}
                  />
                  {/* glass button */}
                  <div
                    className={cn(
                      "relative flex items-center gap-1.5 px-4 py-2.5 rounded-[18px] transition-all duration-300 active:scale-[0.92]",
                      isActive ? "" : ""
                    )}
                    style={{
                      background: isActive
                        ? 'linear-gradient(135deg, hsl(var(--accent)), hsl(var(--accent)/0.8))'
                        : 'linear-gradient(135deg, #f59e0b, #f97316)',
                      boxShadow: isActive
                        ? '0 8px 24px hsl(var(--accent)/0.5), inset 0 1px 0 rgba(255,255,255,0.25)'
                        : '0 8px 24px rgba(245,158,11,0.5), inset 0 1px 0 rgba(255,255,255,0.3)',
                      border: '1px solid rgba(255,255,255,0.2)',
                    }}
                  >
                    <Icon className="h-5 w-5 text-white drop-shadow" strokeWidth={2.5} />
                    <span className="text-xs font-bold text-white tracking-wide drop-shadow">
                      {t(item.labelKey)}
                    </span>
                  </div>
                </NavLink>
              );
            }

            /* ── Normal nav items ── */
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className="relative flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all duration-300 min-w-[48px] active:scale-95"
              >
                {/* active pill highlight — frosted */}
                {isActive && (
                  <div
                    className="absolute inset-0 rounded-2xl"
                    style={{
                      background: 'linear-gradient(135deg, hsl(var(--accent)/0.18), hsl(var(--accent)/0.06))',
                      border: '1px solid hsl(var(--accent)/0.25)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                    }}
                  />
                )}

                {/* icon wrapper */}
                <div className={cn("relative z-10 transition-all duration-300", isActive && "scale-110")}>
                  <Icon
                    className={cn("h-5 w-5 transition-colors duration-300", isActive ? "text-accent drop-shadow" : "text-muted-foreground/70")}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                  {/* soft colour bloom under active icon */}
                  {isActive && (
                    <div
                      className="absolute -inset-2 rounded-full -z-10 blur-md"
                      style={{ background: 'hsl(var(--accent)/0.25)' }}
                    />
                  )}
                </div>

                <span className={cn(
                  "relative z-10 text-[10px] font-semibold transition-all duration-200",
                  isActive ? "text-accent" : "text-muted-foreground/60"
                )}>
                  {t(item.labelKey)}
                </span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
