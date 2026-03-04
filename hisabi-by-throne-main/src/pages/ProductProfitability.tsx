/**
 * ProductProfitability.tsx
 * Per-product profit & margin breakdown — Pro only.
 */

import { useMemo, useState } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Package, ArrowUpDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

import { ProGate } from '@/components/ProGate';
import { useProducts } from '@/hooks/useProducts';
import { useSales } from '@/hooks/useSales';
import { useCurrency } from '@/hooks/useCurrency';
import { cn } from '@/lib/utils';

type SortKey = 'profit' | 'margin' | 'revenue' | 'qty';

export default function ProductProfitability() {
  const { data: products = [] } = useProducts();
  const { data: sales = [] } = useSales();
  const { fmt } = useCurrency();
  const [sortBy, setSortBy] = useState<SortKey>('profit');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

  const rows = useMemo(() => {
    // Aggregate sales per product
    const map: Record<string, { qty: number; revenue: number; cost: number; profit: number }> = {};
    for (const sale of sales) {
      for (const item of sale.items) {
        if (!map[item.productId]) map[item.productId] = { qty: 0, revenue: 0, cost: 0, profit: 0 };
        map[item.productId].qty     += item.quantity;
        map[item.productId].revenue += item.unitPrice * item.quantity;
        map[item.productId].cost    += item.costPerUnit * item.quantity;
        map[item.productId].profit  += item.profit;
      }
    }

    return products
      .map(p => {
        const agg = map[p.id] ?? { qty: 0, revenue: 0, cost: 0, profit: 0 };
        const margin = agg.revenue > 0 ? (agg.profit / agg.revenue) * 100 : 0;
        return { ...p, ...agg, margin };
      })
      .sort((a, b) => {
        const v = sortDir === 'desc' ? -1 : 1;
        if (sortBy === 'profit')  return (a.profit  - b.profit)  * v;
        if (sortBy === 'margin')  return (a.margin  - b.margin)  * v;
        if (sortBy === 'revenue') return (a.revenue - b.revenue) * v;
        if (sortBy === 'qty')     return (a.qty     - b.qty)     * v;
        return 0;
      });
  }, [products, sales, sortBy, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(key); setSortDir('desc'); }
  };

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      onClick={() => toggleSort(k)}
      className={cn(
        'flex items-center gap-0.5 text-[10px] font-semibold px-2 py-1 rounded-lg transition-colors',
        sortBy === k ? 'bg-accent/20 text-accent' : 'text-muted-foreground hover:bg-muted'
      )}
    >
      {label}
      <ArrowUpDown className="h-2.5 w-2.5" />
    </button>
  );

  return (
    <ProGate feature="canViewProductProfitability">
      <div className="min-h-screen bg-background pb-28" dir="rtl">
        <header className="sticky top-0 z-40 safe-top">
          <div className="bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/reports">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div>
                <h1 className="text-xl font-bold">ربحية المنتجات</h1>
                <p className="text-xs text-muted-foreground">{rows.length} منتج</p>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-4 space-y-3">
          {/* Sort bar */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs text-muted-foreground ml-1">ترتيب:</span>
            <SortBtn k="profit"  label="الربح" />
            <SortBtn k="margin"  label="الهامش" />
            <SortBtn k="revenue" label="الإيراد" />
            <SortBtn k="qty"     label="الكمية" />
          </div>

          {/* Rows */}
          {rows.map((p, i) => {
            const isProfit = p.profit >= 0;
            return (
              <div key={p.id} className="glass-card p-4 space-y-2">
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-bold text-muted-foreground w-5 text-center">{i + 1}</span>
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{p.name}</p>
                      {p.category && <p className="text-[10px] text-muted-foreground">{p.category}</p>}
                    </div>
                  </div>
                  <div className={cn('flex items-center gap-1 text-sm font-bold shrink-0', isProfit ? 'text-success' : 'text-destructive')}>
                    {isProfit ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {fmt(p.profit)}
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border/30">
                  <div className="text-center">
                    <p className="text-[9px] text-muted-foreground mb-0.5">الإيراد</p>
                    <p className="text-xs font-bold">{fmt(p.revenue)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] text-muted-foreground mb-0.5">التكلفة</p>
                    <p className="text-xs font-bold text-warning">{fmt(p.cost)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] text-muted-foreground mb-0.5">الكمية</p>
                    <p className="text-xs font-bold">{p.qty}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] text-muted-foreground mb-0.5">الهامش</p>
                    <p className={cn('text-xs font-bold', p.margin >= 15 ? 'text-success' : p.margin >= 5 ? 'text-warning' : 'text-destructive')}>
                      {p.margin.toFixed(1)}%
                    </p>
                  </div>
                </div>

                {/* Margin bar */}
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', p.margin >= 15 ? 'bg-success' : p.margin >= 5 ? 'bg-warning' : 'bg-destructive')}
                    style={{ width: `${Math.min(100, Math.max(0, p.margin))}%` }}
                  />
                </div>
              </div>
            );
          })}

          {rows.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
              <Package className="h-10 w-10 opacity-30" />
              <p className="text-sm">لا توجد بيانات بعد</p>
            </div>
          )}
        </main>
      </div>
    </ProGate>
  );
}
