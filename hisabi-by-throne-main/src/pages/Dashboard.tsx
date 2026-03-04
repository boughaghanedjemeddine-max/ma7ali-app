import { useState } from "react";
import { useTranslation } from "react-i18next";
import { 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  Wallet,
  CreditCard,
  Receipt,
  Sparkles,
  ChevronRight,
  ShoppingBag,
  Menu,
  Bell,
  BarChart2,
  Users,
  Truck,
  FileText,
  Settings,
  HardDrive,
  Printer,
  AlertTriangle,
  PieChart,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { HisabiLogo } from "@/components/HisabiLogo";
import { StatCard } from "@/components/StatCard";
import { AlertCard } from "@/components/AlertCard";
import { QuickActionButton } from "@/components/QuickActionButton";
import { ProfitDisplay } from "@/components/ProfitDisplay";
import { ProductPerformanceCard } from "@/components/ProductPerformanceCard";
import { useDashboardStats, useProductPerformance } from "@/hooks/useDashboard";
import { useSales } from "@/hooks/useSales";
import { usePlan } from "@/hooks/usePlan";
import { useCurrency } from "@/hooks/useCurrency";
import { cn } from "@/lib/utils";
import { useProducts } from "@/hooks/useProducts";

/* ─── More Drawer ─────────────────────────────────────────── */
function MoreDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();

  const links = [
    { to: "/customers",            icon: Users,         label: t("nav.customers") },
    { to: "/suppliers",            icon: Truck,         label: t("nav.suppliers") },
    { to: "/reports",              icon: FileText,       label: t("nav.reports") },
    { to: "/insights",             icon: BarChart2,      label: t("nav.insights") },
    { to: "/smart-alerts",         icon: AlertTriangle,  label: t("nav.smartAlerts") },
    { to: "/product-profitability",icon: PieChart,       label: t("nav.profitability") },
    { to: "/backup",               icon: HardDrive,      label: t("nav.backup") },
    { to: "/printer",              icon: Printer,        label: t("nav.printer") },
    { to: "/settings",             icon: Settings,       label: t("nav.settings") },
  ];

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-72 p-0">
        <SheetHeader className="px-5 py-4 border-b border-border/30">
          <SheetTitle className="text-base font-bold">{t("nav.more")}</SheetTitle>
        </SheetHeader>
        <nav className="px-3 py-3 space-y-1">
          {links.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium hover:bg-muted/60 active:bg-muted transition-colors"
            >
              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

export default function Dashboard() {
  const [moreOpen, setMoreOpen] = useState(false);
  const { t } = useTranslation();
  const { data: stats } = useDashboardStats();
  const { data: productPerformance = [] } = useProductPerformance();
  const { data: sales = [] } = useSales();
  const { fmt } = useCurrency();
  const { isPro } = usePlan();

  // Pro: weekly sparkline + month comparison
  const proData = (() => {
    const now = new Date();
    const weekDays: { day: string; profit: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('ar-DZ', { weekday: 'short' });
      const profit = sales
        .filter(s => s.date === key)
        .reduce((a, s) => a + s.totalProfit, 0);
      weekDays.push({ day: label, profit });
    }
    const monthAgo = new Date(now.getTime() - 30 * 86400000);
    const twoMonthsAgo = new Date(now.getTime() - 60 * 86400000);
    const thisMonthProfit = sales.filter(s => new Date(s.date) >= monthAgo).reduce((a, s) => a + s.totalProfit, 0);
    const lastMonthProfit = sales.filter(s => { const d = new Date(s.date); return d >= twoMonthsAgo && d < monthAgo; }).reduce((a, s) => a + s.totalProfit, 0);
    const growth = lastMonthProfit > 0 ? Math.round(((thisMonthProfit - lastMonthProfit) / lastMonthProfit) * 100) : null;
    const maxProfit = Math.max(...weekDays.map(d => d.profit), 1);
    return { weekDays, thisMonthProfit, lastMonthProfit, growth, maxProfit };
  })();

  const bestProduct = productPerformance[0];
  const worstProduct = productPerformance[productPerformance.length - 1];

  // Generate alerts from stats
  const alerts: { type: "low-stock" | "loss" | "expense"; title: string; message: string }[] = [];
  
  if (stats?.lowStockProducts && stats.lowStockProducts.length > 0) {
    stats.lowStockProducts.forEach(p => {
      alerts.push({
        type: "low-stock",
        title: t('dashboard.lowStock'),
        message: t('dashboard.remainingItems', { count: p.quantity, name: p.name })
      });
    });
  }
  
  if (stats?.belowCostSales && stats.belowCostSales.length > 0) {
    alerts.push({
      type: "loss",
      title: t('dashboard.sellingAtLoss'),
      message: t('dashboard.salesBelowCost', { count: stats.belowCostSales.length })
    });
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 safe-top">
        <div className="bg-background/80 backdrop-blur-xl border-b border-border/30 px-4 py-3">
          <div className="flex items-center justify-between">
            <HisabiLogo size="sm" />
            <button
              onClick={() => setMoreOpen(true)}
              className="p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors active:scale-95"
            >
              <Menu className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-5 space-y-6">
        {/* Hero Section - Today's Profit */}
        <section className="animate-fade-up">
          <div className="throne-card p-6 border-accent/20 bg-gradient-to-br from-accent/10 via-card to-card">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-accent/10 to-transparent rounded-bl-full" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-primary/10 to-transparent rounded-tr-full" />
            
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-4 w-4 text-accent" />
                <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                  {t('dashboard.todayProfit')}
                </span>
              </div>
              
              <ProfitDisplay 
                value={stats?.profitAfterAllExpenses || 0}
                size="xl"
                className="mb-4"
              />

              {/* Mini stats row */}
              <div className="flex items-center justify-center gap-6 pt-4 border-t border-border/30">
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground uppercase">{t('dashboard.sales')}</p>
                  <p className="text-lg font-bold number-display text-foreground">
                    {fmt(stats?.sales || 0)}
                  </p>
                </div>
                <div className="w-px h-8 bg-border/50" />
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground uppercase">{t('dashboard.transactions')}</p>
                  <p className="text-lg font-bold number-display text-foreground">
                    {stats?.transactions || 0}
                  </p>
                </div>
                <div className="w-px h-8 bg-border/50" />
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground uppercase">{t('dashboard.expenses')}</p>
                  <p className="text-lg font-bold number-display text-warning">
                    {fmt(stats?.expenses || 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 gap-3">
          <StatCard
            title={t('dashboard.sales')}
            value={fmt(stats?.sales || 0)}
            icon={ShoppingCart}
            variant="primary"
            delay={1}
          />
          <StatCard
            title={t('dashboard.totalProfit')}
            value={fmt(Math.round(stats?.profit || 0))}
            icon={TrendingUp}
            variant="gold"
            delay={2}
          />
          <StatCard
            title={t('dashboard.transactions')}
            value={stats?.transactions || 0}
            subtitle={t('dashboard.salesCount')}
            icon={Receipt}
            variant="default"
            delay={3}
          />
          <StatCard
            title={t('dashboard.expenses')}
            value={fmt(stats?.expenses || 0)}
            icon={Wallet}
            variant="warning"
            delay={4}
          />
        </section>

        {/* Product Performance - Best vs Worst */}
        {(bestProduct || worstProduct) && (
          <section className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">
                {t('dashboard.productPerformance')}
              </h2>
              <Button variant="ghost" size="sm" className="text-accent h-8 px-2" asChild>
                <Link to="/reports">
                  {t('common.details')}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {bestProduct && (
                <ProductPerformanceCard 
                  type="best" 
                  product={bestProduct}
                  delay={1}
                />
              )}
              {worstProduct && worstProduct !== bestProduct && (
                <ProductPerformanceCard 
                  type="worst" 
                  product={worstProduct}
                  delay={2}
                />
              )}
            </div>
          </section>
        )}

        {/* Quick Actions */}
        <section className="animate-fade-up" style={{ animationDelay: "0.25s" }}>
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wide mb-3">
            {t('dashboard.quickActions')}
          </h2>
          <div className="grid grid-cols-4 gap-2">
            <QuickActionButton
              icon={ShoppingBag}
              label={t('nav.cart')}
              to="/pos"
              variant="gold"
              delay={1}
            />
            <QuickActionButton
              icon={Package}
              label={t('dashboard.addProduct')}
              to="/stock/new"
              variant="primary"
              delay={2}
            />
            <QuickActionButton
              icon={CreditCard}
              label={t('nav.credits')}
              to="/credits"
              delay={3}
            />
            <QuickActionButton
              icon={Wallet}
              label={t('nav.expenses')}
              to="/expenses"
              delay={4}
            />
          </div>
        </section>

        {/* Alerts */}
        {alerts.length > 0 && (
          <section className="animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wide mb-3">
              {t('dashboard.alerts')}
            </h2>
            <div className="space-y-2">
              {alerts.slice(0, 3).map((alert, index) => (
                <AlertCard key={index} {...alert} />
              ))}
            </div>
          </section>
        )}

        {/* Profit Breakdown */}
        {stats && stats.profit > 0 && (
          <section className="animate-fade-up" style={{ animationDelay: "0.35s" }}>
            <div className="throne-card p-4 border-accent/20">
              <h3 className="font-bold text-foreground text-sm mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent" />
                {t('dashboard.profitDetails')}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">{t('dashboard.totalProfit')}</span>
                  <span className="font-bold number-display">{fmt(Math.round(stats.profit))}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">{t('dashboard.afterShopExpenses')}</span>
                  <span className="font-bold number-display">{fmt(Math.round(stats.profitAfterShopExpenses))}</span>
                </div>
                <div className="h-px bg-border/50" />
                <div className="flex justify-between items-center">
                  <span className="text-foreground font-semibold">{t('dashboard.netProfit')}</span>
                  <span className="gold-text text-xl font-extrabold number-display">
                    {fmt(Math.round(stats.profitAfterAllExpenses))}
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* === Pro Widget: Weekly Sparkline + Growth === */}
        <section className="animate-fade-up" style={{ animationDelay: "0.4s" }} dir="rtl">
          {isPro ? (
            <div className="throne-card p-4 border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-card space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-amber-500" />
                  {t('dashboard.weeklyProfit')}
                </h3>
                {proData.growth !== null && (
                  <span className={cn(
                    'text-xs font-bold px-2 py-0.5 rounded-full',
                    proData.growth >= 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                  )}>
                  {proData.growth >= 0 ? '▲' : '▼'} {Math.abs(proData.growth)}% {t('dashboard.vsLastMonth')}
                  </span>
                )}
              </div>

              {/* Sparkline bars */}
              <div className="flex items-end gap-1.5 h-14">
                {proData.weekDays.map((d, i) => {
                  const pct = proData.maxProfit > 0 ? (d.profit / proData.maxProfit) * 100 : 0;
                  const isToday = i === 6;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex items-end" style={{ height: '40px' }}>
                        <div
                          className={cn('w-full rounded-t-sm transition-all', isToday ? 'bg-amber-500' : 'bg-amber-500/30')}
                          style={{ height: `${Math.max(pct, 4)}%` }}
                          title={fmt(d.profit)}
                        />
                      </div>
                      <span className="text-[8px] text-muted-foreground">{d.day}</span>
                    </div>
                  );
                })}
              </div>

              {/* Quick links */}
              <div className="flex gap-2 pt-1">
                <Link to="/insights" className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-xl bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition-colors">
                  <Sparkles className="h-3.5 w-3.5" />
                  {t('dashboard.analyticsPro')}
                </Link>
                <Link to="/smart-alerts" className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-xl bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition-colors">
                  <Bell className="h-3.5 w-3.5" />
                  {t('dashboard.alertsPro')}
                </Link>
                <Link to="/product-profitability" className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-xl bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition-colors">
                  <BarChart2 className="h-3.5 w-3.5" />
                  {t('dashboard.profitabilityPro')}
                </Link>
              </div>
            </div>
          ) : (
            <div className="throne-card p-4 border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-card">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold flex items-center gap-1.5">
                    <BarChart2 className="h-4 w-4 text-amber-500" />
                    {t('dashboard.proStats')}
                  </p>
                  <p className="text-xs text-muted-foreground">{t('dashboard.proDescription')}</p>
                </div>
                <Link
                  to="/settings"
                  className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                >
                  {t('common.upgrade')}
                </Link>
              </div>
            </div>
          )}
        </section>
      </main>

      <MoreDrawer open={moreOpen} onClose={() => setMoreOpen(false)} />
    </div>
  );
}
