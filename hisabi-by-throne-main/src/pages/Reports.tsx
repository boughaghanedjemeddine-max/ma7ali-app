import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Package,
  Wallet,
  ShoppingCart,
  ArrowLeft,
  BarChart3,
  PieChart as PieChartIcon,
  DollarSign,
  Download,
  Crown,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { UpgradeModal } from "@/components/UpgradeModal";
import { useCanExportReports, useCanViewAllPeriods, useCanComparePeriods, useCanExportMonthlySummary } from "@/hooks/usePlan";
import { useProducts } from "@/hooks/useProducts";
import { useSales } from "@/hooks/useSales";
import { useExpenses } from "@/hooks/useExpenses";
import { useProductPerformance } from "@/hooks/useDashboard";
import { getCurrentDate } from "@/lib/appDB";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/hooks/useCurrency";
import { settingsDB } from "@/lib/appDB";
import { LazyCharts } from "@/components/LazyCharts";

type Period = 'today' | 'week' | 'month' | 'all';

const COLORS = ['hsl(210, 55%, 35%)', 'hsl(43, 70%, 50%)', 'hsl(142, 70%, 45%)', 'hsl(25, 30%, 35%)', 'hsl(0, 72%, 51%)'];

export default function Reports() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<Period>('month');
  const { fmt } = useCurrency();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<string | undefined>();
  const canExport = useCanExportReports();
  const canViewAll = useCanViewAllPeriods();
  const { canCompare } = useCanComparePeriods();
  const { canExport: canExportPDF } = useCanExportMonthlySummary();

  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  useEffect(() => {
    settingsDB.get().then(s => { if (s?.lowStockThreshold) setLowStockThreshold(s.lowStockThreshold); });
  }, []);
  
  const { data: products = [] } = useProducts();
  const { data: sales = [] } = useSales();
  const { data: expenses = [] } = useExpenses();
  const { data: productPerformance = [] } = useProductPerformance();

  // Filter data by period
  const filterByPeriod = <T extends { date?: string; createdAt?: string }>(items: T[]): T[] => {
    const today = new Date();
    const getDate = (item: T) => new Date(item.date || item.createdAt || '');
    
    switch (period) {
      case 'today':
        return items.filter(item => {
          const d = getDate(item);
          return d.toDateString() === today.toDateString();
        });
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return items.filter(item => getDate(item) >= weekAgo);
      case 'month':
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        return items.filter(item => getDate(item) >= monthAgo);
      default:
        return items;
    }
  };

  const filteredSales = filterByPeriod(sales);
  const filteredExpenses = filterByPeriod(expenses);

  // === COMPARISON: previous period data ===
  const prevPeriodData = (() => {
    const today = new Date();
    const getDate = (item: { date?: string; createdAt?: string }) =>
      new Date(item.date || item.createdAt || '');
    let prevSales: typeof sales = [];
    let prevExpenses: typeof expenses = [];
    if (period === 'today') {
      const yesterday = new Date(today.getTime() - 86400000);
      prevSales = sales.filter(i => getDate(i).toDateString() === yesterday.toDateString());
      prevExpenses = expenses.filter(i => getDate(i).toDateString() === yesterday.toDateString());
    } else if (period === 'week') {
      const twoWeeksAgo = new Date(today.getTime() - 14 * 86400000);
      const oneWeekAgo  = new Date(today.getTime() - 7  * 86400000);
      prevSales = sales.filter(i => { const d = getDate(i); return d >= twoWeeksAgo && d < oneWeekAgo; });
      prevExpenses = expenses.filter(i => { const d = getDate(i); return d >= twoWeeksAgo && d < oneWeekAgo; });
    } else if (period === 'month') {
      const twoMonthsAgo = new Date(today.getTime() - 60 * 86400000);
      const oneMonthAgo  = new Date(today.getTime() - 30 * 86400000);
      prevSales = sales.filter(i => { const d = getDate(i); return d >= twoMonthsAgo && d < oneMonthAgo; });
      prevExpenses = expenses.filter(i => { const d = getDate(i); return d >= twoMonthsAgo && d < oneMonthAgo; });
    }
    const pSales   = prevSales.reduce((a, s) => a + s.total, 0);
    const pProfit  = prevSales.reduce((a, s) => a + s.totalProfit, 0);
    const pExpenses = prevExpenses.reduce((a, e) => a + e.amount, 0);
    return { sales: pSales, profit: pProfit, expenses: pExpenses };
  })();

  const pctChange = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  // Calculate stats
  const totalSales = filteredSales.reduce((acc, s) => acc + s.total, 0);
  const totalProfit = filteredSales.reduce((acc, s) => acc + s.totalProfit, 0);
  const totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = totalProfit - totalExpenses;
  const shopExpenses = filteredExpenses.filter(e => e.type === 'shop').reduce((acc, e) => acc + e.amount, 0);
  const personalExpenses = filteredExpenses.filter(e => e.type === 'personal').reduce((acc, e) => acc + e.amount, 0);

  // Daily sales chart data
  const dailySalesData = (() => {
    const salesByDay: Record<string, number> = {};
    filteredSales.forEach(sale => {
      const day = sale.date.split('-').slice(1).join('/');
      salesByDay[day] = (salesByDay[day] || 0) + sale.total;
    });
    return Object.entries(salesByDay)
      .map(([day, total]) => ({ day, total }))
      .slice(-7);
  })();

  // Product category chart data
  const categoryData = (() => {
    const categories: Record<string, number> = {};
    products.forEach(p => {
      const cat = p.category || 'أخرى';
      categories[cat] = (categories[cat] || 0) + p.quantity;
    });
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  })();

  // Expenses breakdown
  const expenseCategoryData = (() => {
    const categories: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      const cat = e.category || (e.type === 'shop' ? 'مصاريف المحل' : 'مصاريف شخصية');
      categories[cat] = (categories[cat] || 0) + e.amount;
    });
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  })();

  // Top products
  const topProducts = productPerformance.slice(0, 5);
  const worstProducts = [...productPerformance].sort((a, b) => a.marginPercent - b.marginPercent).slice(0, 5);

  // --- NEW: Composite trend (last 10 days: sales + profit + expenses) ---
  const trendData = (() => {
    const map: Record<string, { day: string; sales: number; profit: number; expenses: number }> = {};
    filteredSales.forEach(sale => {
      const d = sale.date.slice(5); // MM-DD
      if (!map[d]) map[d] = { day: d, sales: 0, profit: 0, expenses: 0 };
      map[d].sales  += sale.total;
      map[d].profit += sale.totalProfit;
    });
    filteredExpenses.forEach(exp => {
      const d = (exp.date || exp.createdAt || '').slice(5);
      if (!map[d]) map[d] = { day: d, sales: 0, profit: 0, expenses: 0 };
      map[d].expenses += exp.amount;
    });
    return Object.values(map)
      .sort((a, b) => a.day.localeCompare(b.day))
      .slice(-10);
  })();

  // --- NEW: Profit margin by category ---
  const categoryMarginData = (() => {
    const cats: Record<string, { sales: number; profit: number; qty: number }> = {};
    filteredSales.forEach(sale => {
      sale.items?.forEach(item => {
        const cat = products.find(p => p.id === item.productId)?.category || 'أخرى';
        if (!cats[cat]) cats[cat] = { sales: 0, profit: 0, qty: 0 };
        cats[cat].sales  += item.unitPrice * item.quantity;
        cats[cat].profit += item.profit;
        cats[cat].qty    += item.quantity;
      });
    });
    return Object.entries(cats)
      .map(([name, v]) => ({
        name,
        margin: v.sales > 0 ? Math.round((v.profit / v.sales) * 100) : 0,
        profit: v.profit,
      }))
      .sort((a, b) => b.margin - a.margin)
      .slice(0, 6);
  })();

  const profitMarginPct = totalSales > 0 ? Math.round((totalProfit / totalSales) * 100) : 0;

  const handleExportCSV = () => {
    const rows: (string | number)[][] = [
      [t('reports.csvDate'), t('reports.csvType'), t('reports.csvAmount'), t('reports.csvProfit'), t('reports.csvDiscount'), t('reports.csvPayment')],
      ...filteredSales.map(s => [s.date, t('reports.csvSale'), s.total, s.totalProfit, s.discount ?? 0, s.paymentType === 'cash' ? t('reports.csvCash') : t('reports.csvCredit')]),
      ...filteredExpenses.map(e => [e.date, e.type === 'shop' ? t('reports.csvShopExpense') : t('reports.csvPersonalExpense'), e.amount, '', '', '']),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `تقرير-${period}-${new Date().toLocaleDateString('ar')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const periods: { label: string; value: Period }[] = [
    { label: t('reports.periodToday'), value: 'today' },
    { label: t('reports.periodWeek'), value: 'week' },
    { label: t('reports.periodMonth'), value: 'month' },
    { label: t('reports.periodAll'), value: 'all' },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 safe-top">
        <div className="bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/dashboard">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <h1 className="text-xl font-bold">{t('reports.title')}</h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              title="خلاصة شهرية PDF"
              onClick={() => {
                if (!canExportPDF) {
                  setUpgradeReason(t('reports.monthlySummaryLocked'));
                  setShowUpgrade(true);
                } else {
                  import('@/lib/generateMonthlySummaryPDF').then(m =>
                    m.generateMonthlySummaryPDF({ sales: filteredSales, expenses: filteredExpenses, period })
                  );
                }
              }}
            >
              {canExportPDF ? (
                <FileText className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Crown className="h-4 w-4 text-amber-400" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Period Selector */}
      <div className="px-4 py-3 bg-card/50 border-b border-border/30">
        <div className="flex gap-2">
          {periods.map((p) => {
            const isAllPeriod = p.value === 'all';
            const locked = isAllPeriod && !canViewAll;
            return (
              <Button
                key={p.value}
                variant={period === p.value ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => {
                  if (locked) {
                    setUpgradeReason(t('reports.allPeriodLocked'));
                    setShowUpgrade(true);
                  } else {
                    setPeriod(p.value);
                  }
                }}
                className="flex-1 gap-1"
              >
                {locked && <Crown className="h-3 w-3 text-amber-500" />}
                {p.label}
              </Button>
            );
          })}
        </div>
      </div>

      <main className="px-4 py-4 space-y-6">
        {/* Summary Cards */}
        <section className="grid grid-cols-2 gap-3">
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <ShoppingCart className="h-4 w-4" />
              <span className="text-xs text-muted-foreground">{t('reports.sales')}</span>
            </div>
            <p className="text-xl font-bold text-foreground">{fmt(totalSales)}</p>
            <p className="text-xs text-muted-foreground mt-1">{filteredSales.length} {t('reports.transactions')}</p>
          </div>
          
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">{t('reports.totalProfit')}</span>
            </div>
            <p className="text-xl font-bold text-success">{fmt(totalProfit)}</p>
            <p className="text-xs text-muted-foreground mt-1">{t('reports.margin')} {profitMarginPct}%</p>
          </div>
          
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Wallet className="h-4 w-4" />
              <span className="text-xs">{t('reports.expenses')}</span>
            </div>
            <p className="text-xl font-bold text-warning">{fmt(totalExpenses)}</p>
          </div>
          
          <div className="glass-card p-4 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <div className="flex items-center gap-2 text-accent mb-2">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs">{t('reports.netProfit')}</span>
            </div>
            <p className={cn(
              "text-xl font-bold",
              netProfit >= 0 ? "text-accent" : "text-destructive"
            )}>
              {fmt(netProfit)}
            </p>
          </div>
        </section>

        {/* === PRO: Period Comparison === */}
        {canCompare && period !== 'all' && (
          <section className="space-y-2" dir="rtl">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-500" />
              {t('reports.comparePeriod')}
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {([
                { label: t('reports.salesLabel'),    curr: totalSales,    prev: prevPeriodData.sales,    color: 'text-foreground' },
                { label: t('reports.profitLabel'),   curr: totalProfit,   prev: prevPeriodData.profit,   color: 'text-success' },
                { label: t('reports.expensesLabel'), curr: totalExpenses, prev: prevPeriodData.expenses, color: 'text-warning', inverse: true },
              ] as const).map(({ label, curr, prev, color, inverse }) => {
                const pct = pctChange(curr, prev);
                const isUp = pct > 0;
                const isDown = pct < 0;
                const good = inverse ? isDown : isUp;
                return (
                  <div key={label} className="glass-card p-3 flex flex-col gap-1">
                    <span className="text-[10px] text-muted-foreground">{label}</span>
                    <span className={`text-sm font-bold ${color}`}>{fmt(curr)}</span>
                    <div className={`flex items-center gap-0.5 text-xs font-semibold ${
                      pct === 0 ? 'text-muted-foreground' : good ? 'text-success' : 'text-destructive'
                    }`}>
                      {pct === 0 ? <Minus className="h-3 w-3" /> : good ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {Math.abs(pct)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
        {!canCompare && period !== 'all' && (
          <section className="glass-card p-4 flex items-center justify-between gap-3" dir="rtl">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">{t('reports.comparePro')}</span>
            </div>
            <button
              onClick={() => { setUpgradeReason(t('reports.compareLocked')); setShowUpgrade(true); }}
              className="text-xs text-amber-600 font-semibold border border-amber-500/30 px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
            >
              {t('reports.upgradeBtn')}
            </button>
          </section>
        )}

        {/* Composite Trend Chart */}
        {trendData.length > 1 && (
          <section className="glass-card p-4">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent" />
              {t('reports.trendTitle')}
            </h3>
            <LazyCharts>
              {(RC) => (
              <RC.ResponsiveContainer width="100%" height={220}>
              <RC.AreaChart data={trendData}>
                <defs>
                  <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(210,55%,35%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(210,55%,35%)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142,70%,45%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(142,70%,45%)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(43,70%,50%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(43,70%,50%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <RC.CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <RC.XAxis dataKey="day" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <RC.YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} width={40} />
                <RC.Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  formatter={(v: number, name: string) => [
                    fmt(v),
                    name === 'sales' ? t('reports.salesLabel') : name === 'profit' ? t('reports.profitLabel') : t('reports.expensesLabel'),
                  ]}
                />
                <RC.Legend formatter={(v) => v === 'sales' ? t('reports.salesLabel') : v === 'profit' ? t('reports.profitLabel') : t('reports.expensesLabel')} />
                <RC.Area type="monotone" dataKey="sales"    stroke="hsl(210,55%,35%)" fill="url(#gSales)"    strokeWidth={2} />
                <RC.Area type="monotone" dataKey="profit"   stroke="hsl(142,70%,45%)" fill="url(#gProfit)"   strokeWidth={2} />
                <RC.Area type="monotone" dataKey="expenses" stroke="hsl(43,70%,50%)"  fill="url(#gExpenses)" strokeWidth={2} />
              </RC.AreaChart>
              </RC.ResponsiveContainer>
              )}
            </LazyCharts>
          </section>
        )}

        {/* Sales Chart */}
        {dailySalesData.length > 0 && (
          <section className="glass-card p-4">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              {t('reports.sales')}
            </h3>
            <LazyCharts>
              {(RC) => (
              <RC.ResponsiveContainer width="100%" height={200}>
              <RC.BarChart data={dailySalesData}>
                <RC.XAxis 
                  dataKey="day" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <RC.YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <RC.Tooltip 
                  contentStyle={{ 
                    background: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [fmt(value), t('reports.salesLabel')]}
                />
                <RC.Bar dataKey="total" fill="hsl(210, 55%, 35%)" radius={[4, 4, 0, 0]} />
              </RC.BarChart>
              </RC.ResponsiveContainer>
              )}
            </LazyCharts>
          </section>
        )}

        {/* Category Distribution */}
        {categoryData.length > 0 && (
          <section className="glass-card p-4">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-accent" />
              {t('reports.categoryDistrib')}
            </h3>
            <div className="flex items-center">
              <LazyCharts fallback={<div className="w-1/2 h-[150px] animate-pulse bg-muted/30 rounded-lg" />}>
                {(RC) => (
                <RC.ResponsiveContainer width="50%" height={150}>
                <RC.PieChart>
                  <RC.Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryData.map((_, index) => (
                      <RC.Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </RC.Pie>
                </RC.PieChart>
                </RC.ResponsiveContainer>
                )}
              </LazyCharts>
              <div className="flex-1 space-y-2">
                {categoryData.map((cat, index) => (
                  <div key={cat.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-foreground flex-1">{cat.name}</span>
                    <span className="text-sm text-muted-foreground">{cat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Expenses Breakdown */}
        {expenseCategoryData.length > 0 && (
          <section className="glass-card p-4">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Wallet className="h-5 w-5 text-warning" />
              {t('reports.expenseBreakdown')}
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('reports.shopExpenses')}</span>
                <span className="font-medium">{fmt(shopExpenses)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('reports.personalExpenses')}</span>
                <span className="font-medium">{fmt(personalExpenses)}</span>
              </div>
              <div className="border-t border-border/50 pt-3 space-y-2">
                {expenseCategoryData.slice(0, 5).map(cat => (
                  <div key={cat.name} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{cat.name}</span>
                    <span className="font-medium">{fmt(cat.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Category Profit Margin */}
        {categoryMarginData.length > 0 && (
          <section className="glass-card p-4">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-success" />
              {t('reports.categoryMargin')}
            </h3>
            <LazyCharts>
              {(RC) => (
              <RC.ResponsiveContainer width="100%" height={categoryMarginData.length * 44}>
              <RC.BarChart data={categoryMarginData} layout="vertical">
                <RC.XAxis type="number" unit="%" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <RC.YAxis type="category" dataKey="name" width={80} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <RC.Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  formatter={(v: number) => [`${v}%`, t('reports.margin')]}
                />
                <RC.Bar dataKey="margin" radius={[0, 4, 4, 0]}>
                  {categoryMarginData.map((entry, i) => (
                    <RC.Cell key={i} fill={entry.margin >= 20 ? 'hsl(142,70%,45%)' : entry.margin >= 10 ? 'hsl(43,70%,50%)' : 'hsl(0,72%,51%)'} />
                  ))}
                </RC.Bar>
              </RC.BarChart>
              </RC.ResponsiveContainer>
              )}
            </LazyCharts>
          </section>
        )}

        {/* Top Products */}
        {topProducts.length > 0 && (
          <section className="glass-card p-4">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              {t('reports.topProducts')}
            </h3>
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center gap-3">
                  <span className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                    index === 0 ? "bg-accent/20 text-accent" :
                    index === 1 ? "bg-primary/20 text-primary" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('reports.sold')}: {product.soldQuantity} | {t('reports.margin')}: {Math.round(product.marginPercent)}%
                    </p>
                  </div>
                  <span className="text-sm font-bold text-success">
                    {fmt(product.totalProfit)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Worst Products */}
        {worstProducts.length > 0 && (
          <section className="glass-card p-4">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-destructive" />
              {t('reports.worstProducts')}
            </h3>
            <div className="space-y-3">
              {worstProducts.map((product) => (
                <div key={product.id} className="flex items-center gap-3">
                  <div 
                    className={cn(
                      "w-2 h-8 rounded-full",
                      product.marginPercent < 10 ? "bg-destructive" : 
                      product.marginPercent < 20 ? "bg-warning" : "bg-success"
                    )}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('reports.cost')}: {fmt(product.costPerUnit)} | {t('reports.salePrice')}: {fmt(product.salePrice)}
                    </p>
                  </div>
                  <span className={cn(
                    "text-sm font-bold",
                    product.marginPercent < 10 ? "text-destructive" : 
                    product.marginPercent < 20 ? "text-warning" : "text-success"
                  )}>
                    {Math.round(product.marginPercent)}%
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Stock Overview */}
        <section className="glass-card p-4">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {t('reports.stockOverview')}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold text-foreground">{products.length}</p>
              <p className="text-xs text-muted-foreground">{t('reports.productCount')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {products.reduce((acc, p) => acc + p.quantity, 0)}
              </p>
              <p className="text-xs text-muted-foreground">{t('reports.stockUnits')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-warning">
                {products.filter(p => p.quantity <= lowStockThreshold).length}
              </p>
              <p className="text-xs text-muted-foreground">{t('reports.lowStock')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">
                {fmt(products.reduce((acc, p) => acc + (p.quantity * p.salePrice), 0))}
              </p>
              <p className="text-xs text-muted-foreground">{t('reports.stockValue')}</p>
            </div>
          </div>
        </section>
      </main>
      <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} reason={upgradeReason} />
    </div>
  );
}
