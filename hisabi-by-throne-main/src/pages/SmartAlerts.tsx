/**
 * SmartAlerts.tsx
 * Intelligent alerts: unpaid invoices, zero-sale products, low stock, profit drop.
 * Pro only.
 */

import { useMemo } from 'react';
import { ArrowLeft, AlertTriangle, Bell, TrendingDown, Package, FileX, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

import { ProGate } from '@/components/ProGate';
import { useProducts } from '@/hooks/useProducts';
import { useSales } from '@/hooks/useSales';
import { useInvoices } from '@/hooks/useInvoices';
import { useExpenses } from '@/hooks/useExpenses';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';

type AlertSeverity = 'critical' | 'warning' | 'info';

interface SmartAlert {
  id: string;
  severity: AlertSeverity;
  icon: typeof AlertTriangle;
  title: string;
  description: string;
  action?: { label: string; to: string };
}

const SEV_STYLE: Record<AlertSeverity, { bg: string; border: string; icon: string; badge: string }> = {
  critical: { bg: 'bg-destructive/5',  border: 'border-destructive/30', icon: 'text-destructive', badge: 'bg-destructive/10 text-destructive' },
  warning:  { bg: 'bg-warning/5',      border: 'border-warning/30',     icon: 'text-warning',     badge: 'bg-warning/10 text-warning' },
  info:     { bg: 'bg-accent/5',       border: 'border-accent/30',      icon: 'text-accent',      badge: 'bg-accent/10 text-accent' },
};
const SEV_LABEL: Record<AlertSeverity, string> = { critical: 'عاجل', warning: 'تنبيه', info: 'معلومة' };

export default function SmartAlerts() {
  const { data: products = [] } = useProducts();
  const { data: sales = [] } = useSales();
  const { data: invoices = [] } = useInvoices();
  const { data: expenses = [] } = useExpenses();
  const { fmt } = useCurrency();

  const alerts = useMemo<SmartAlert[]>(() => {
    const result: SmartAlert[] = [];
    const now = new Date();

    // 1. Unpaid invoices older than 7 days
    const overdueInvoices = invoices.filter(inv => {
      if (inv.status === 'paid') return false;
      const diff = (now.getTime() - new Date(inv.date).getTime()) / 86400000;
      return diff >= 7;
    });
    if (overdueInvoices.length > 0) {
      result.push({
        id: 'overdue-invoices',
        severity: 'critical',
        icon: FileX,
        title: `${overdueInvoices.length} فاتورة غير مدفوعة منذ أكثر من أسبوع`,
        description: `إجمالي المبلغ المعلق: ${fmt(overdueInvoices.reduce((a, i) => a + i.total, 0))}`,
        action: { label: 'عرض الفواتير', to: '/invoices' },
      });
    }

    // 2. Products sold below cost
    const lossSales = sales.filter(s => s.items.some(item => item.unitPrice < item.costPerUnit));
    if (lossSales.length > 0) {
      result.push({
        id: 'loss-sales',
        severity: 'critical',
        icon: TrendingDown,
        title: `${lossSales.length} عملية بيع بخسارة`,
        description: 'بعض المنتجات تُباع بأقل من تكلفتها. راجع الأسعار فوراً.',
        action: { label: 'عرض المنتجات', to: '/stock' },
      });
    }

    // 3. Low stock products (quantity < 5)
    const lowStock = products.filter(p => p.quantity > 0 && p.quantity < 5);
    if (lowStock.length > 0) {
      result.push({
        id: 'low-stock',
        severity: 'warning',
        icon: Package,
        title: `${lowStock.length} منتج يقترب من النفاد`,
        description: lowStock.slice(0, 3).map(p => `«${p.name}» (${p.quantity} قطعة)`).join('، ') + (lowStock.length > 3 ? '...' : ''),
        action: { label: 'المخزون', to: '/stock' },
      });
    }

    // 4. Out of stock products
    const outOfStock = products.filter(p => p.quantity === 0);
    if (outOfStock.length > 0) {
      result.push({
        id: 'out-of-stock',
        severity: 'critical',
        icon: AlertTriangle,
        title: `${outOfStock.length} منتج نفد تماماً`,
        description: outOfStock.slice(0, 3).map(p => `«${p.name}»`).join('، ') + (outOfStock.length > 3 ? '...' : ''),
        action: { label: 'تحديث المخزون', to: '/stock' },
      });
    }

    // 5. Products with zero sales in the last 30 days
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
    const recentlySoldIds = new Set<string>();
    for (const sale of sales) {
      if (new Date(sale.date) >= thirtyDaysAgo) {
        for (const item of sale.items) recentlySoldIds.add(item.productId);
      }
    }
    const noSalesProducts = products.filter(p => p.quantity > 0 && !recentlySoldIds.has(p.id));
    if (noSalesProducts.length > 0) {
      result.push({
        id: 'no-sales-30d',
        severity: 'warning',
        icon: TrendingDown,
        title: `${noSalesProducts.length} منتج لم يُباع في آخر 30 يوماً`,
        description: 'فكّر في تخفيض أسعارها أو إجراء عرض ترويجي.',
        action: { label: 'التحليلات', to: '/insights' },
      });
    }

    // 6. Expenses exceed profit this month
    const monthAgo = new Date(now.getTime() - 30 * 86400000);
    const monthSales    = sales.filter(s => new Date(s.date) >= monthAgo);
    const monthExpenses = expenses.filter(e => new Date(e.date || e.createdAt) >= monthAgo);
    const mProfit  = monthSales.reduce((a, s) => a + s.totalProfit, 0);
    const mExpenses = monthExpenses.reduce((a, e) => a + e.amount, 0);
    if (mExpenses > mProfit && mProfit > 0) {
      result.push({
        id: 'expenses-exceed-profit',
        severity: 'critical',
        icon: TrendingDown,
        title: 'المصاريف تتجاوز الربح هذا الشهر',
        description: `الربح: ${fmt(mProfit)} · المصاريف: ${fmt(mExpenses)} · الفارق: ${fmt(mExpenses - mProfit)}`,
        action: { label: 'التقارير', to: '/reports' },
      });
    }

    return result;
  }, [products, sales, invoices, expenses, fmt]);

  return (
    <ProGate feature="canUseSmartAlerts">
      <div className="min-h-screen bg-background pb-28" dir="rtl">
        <header className="sticky top-0 z-40 safe-top">
          <div className="bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/dashboard">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-accent" />
                <h1 className="text-xl font-bold">التنبيهات الذكية</h1>
              </div>
              {alerts.length > 0 && (
                <span className="mr-auto text-xs font-bold bg-destructive text-destructive-foreground rounded-full px-2 py-0.5">
                  {alerts.length}
                </span>
              )}
            </div>
          </div>
        </header>

        <main className="px-4 py-4 space-y-3">
          {alerts.length === 0 && (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-success" />
              </div>
              <div>
                <p className="font-bold text-lg">كل شيء على ما يرام!</p>
                <p className="text-sm text-muted-foreground mt-1">لا توجد تنبيهات حالياً. استمر هكذا.</p>
              </div>
            </div>
          )}

          {/* Critical first */}
          {(['critical', 'warning', 'info'] as AlertSeverity[]).map(sev =>
            alerts
              .filter(a => a.severity === sev)
              .map(alert => {
                const styles = SEV_STYLE[alert.severity];
                const Icon = alert.icon;
                return (
                  <div
                    key={alert.id}
                    className={cn('glass-card p-4 flex gap-3 border', styles.bg, styles.border)}
                  >
                    <div className={cn('mt-0.5 p-2 rounded-xl flex-shrink-0', styles.badge)}>
                      <Icon className={cn('h-4 w-4', styles.icon)} />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-sm leading-tight">{alert.title}</p>
                        <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0', styles.badge)}>
                          {SEV_LABEL[alert.severity]}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{alert.description}</p>
                      {alert.action && (
                        <Link
                          to={alert.action.to}
                          className={cn('inline-block text-xs font-semibold mt-1 underline-offset-2 hover:underline', styles.icon)}
                        >
                          {alert.action.label} ←
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })
          )}
        </main>
      </div>
    </ProGate>
  );
}
