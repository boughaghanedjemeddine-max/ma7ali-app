import { useEffect, useState } from 'react';
import { ArrowLeft, BrainCircuit, AlertCircle, CheckCircle, TrendingDown, TrendingUp, DollarSign, Package, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { ProGate } from '@/components/ProGate';
import { cn } from '@/lib/utils';
import {
  getShopHealthScore,
  getSmartSuggestions,
  getSlowProducts,
  getLossProducts,
  getLowMarginProducts,
  getSuggestedPrice,
  ShopHealthScore,
} from '@/services/businessAdvisor';
import type { Product } from '@/services/db';
import { useCurrency } from '@/hooks/useCurrency';

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? 'text-success' : score >= 60 ? 'text-warning' : 'text-destructive';
  const label = score >= 80 ? 'ممتاز' : score >= 60 ? 'جيد' : 'يحتاج تحسين';
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={cn('text-6xl font-extrabold', color)}>{score}</div>
      <span className={cn('text-sm font-semibold px-3 py-0.5 rounded-full', score >= 80 ? 'bg-success/10 text-success' : score >= 60 ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive')}>
        {label}
      </span>
    </div>
  );
}

function SuggestionItem({ msg }: { msg: string }) {
  const isDanger = msg.includes('خسارة') || msg.includes('تتجاوز');
  const isWarn = msg.includes('ضعيف') || msg.includes('إيجار') || msg.includes('بطيء') || msg.includes('لم يُباع');
  const type = isDanger ? 'danger' : isWarn ? 'warning' : 'good';
  const Icon = isDanger ? AlertCircle : isWarn ? TrendingDown : CheckCircle;
  const cls = isDanger
    ? 'border-destructive/30 bg-destructive/5 text-destructive'
    : isWarn
    ? 'border-warning/30 bg-warning/5 text-warning'
    : 'border-success/30 bg-success/5 text-success';
  return (
    <div className={cn('flex items-start gap-2 p-3 rounded-xl border', cls)}>
      <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <span className="text-sm leading-relaxed text-foreground">{msg}</span>
    </div>
  );
}

export default function Insights() {
  const { fmt: format } = useCurrency();
  const [health, setHealth] = useState<ShopHealthScore | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [slowProducts, setSlowProducts] = useState<Product[]>([]);
  const [lossProducts, setLossProducts] = useState<Product[]>([]);
  const [lowMarginProducts, setLowMarginProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getShopHealthScore(),
      getSmartSuggestions(),
      getSlowProducts(),
      getLossProducts(),
      getLowMarginProducts(),
    ]).then(([h, s, sl, lo, lm]) => {
      setHealth(h);
      setSuggestions(s);
      setSlowProducts(sl);
      setLossProducts(lo);
      setLowMarginProducts(lm);
      setLoading(false);
    });
  }, []);

  return (
    <ProGate feature="canUseInsights">
    <div className="min-h-screen bg-background pb-28" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-40 safe-top">
        <div className="bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-accent" />
              <h1 className="text-xl font-bold">تحليلات ذكية</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 space-y-4 max-w-lg mx-auto">

        {loading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
            جاري تحليل بيانات متجرك...
          </div>
        ) : (
          <>
            {/* Health Score */}
            <section className="glass-card p-5 flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 self-start">
                <Activity className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">صحة المتجر</h2>
              </div>
              {health && <ScoreRing score={health.score} />}
              {health && (
                <div className="w-full grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-muted/40 rounded-xl p-3 space-y-0.5">
                    <p className="text-xs text-muted-foreground">الربح الكلي</p>
                    <p className="font-bold text-success">{format(health.details.profit)}</p>
                  </div>
                  <div className="bg-muted/40 rounded-xl p-3 space-y-0.5">
                    <p className="text-xs text-muted-foreground">المصاريف الكلية</p>
                    <p className="font-bold text-destructive">{format(health.details.expenses)}</p>
                  </div>
                  <div className="bg-muted/40 rounded-xl p-3 space-y-0.5">
                    <p className="text-xs text-muted-foreground">دوران المخزون</p>
                    <p className="font-bold">{health.details.inventoryTurnover.toFixed(2)}</p>
                  </div>
                  <div className="bg-muted/40 rounded-xl p-3 space-y-0.5">
                    <p className="text-xs text-muted-foreground">نسبة الإيجار</p>
                    <p className="font-bold">{(health.details.rentRatio * 100).toFixed(1)}%</p>
                  </div>
                </div>
              )}
            </section>

            {/* Smart Suggestions */}
            <section className="glass-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-accent" />
                <h2 className="font-semibold">نصائح ذكية</h2>
              </div>
              {suggestions.map((msg, i) => (
                <SuggestionItem key={i} msg={msg} />
              ))}
            </section>

            {/* Slow Products */}
            <section className="glass-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-warning" />
                <h2 className="font-semibold">منتجات بطيئة البيع</h2>
              </div>
              {slowProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" /> كل المنتجات تُباع بشكل جيد
                </p>
              ) : (
                <ul className="space-y-2">
                  {slowProducts.map(p => (
                    <li key={p.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="h-4 w-4 text-warning" />
                        <span>{p.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        المخزون: {p.quantity}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Loss Products */}
            <section className="glass-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-destructive" />
                <h2 className="font-semibold">منتجات تُباع بخسارة</h2>
              </div>
              {lossProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" /> لا يوجد منتج يُباع بخسارة
                </p>
              ) : (
                <ul className="space-y-2">
                  {lossProducts.map(p => (
                    <li key={p.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        <span>{p.name}</span>
                      </div>
                      <span className="text-xs text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                        خسارة
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Low Margin — Suggested Prices */}
            <section className="glass-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-success" />
                <h2 className="font-semibold">اقتراح أسعار (هامش 20%)</h2>
              </div>
              {lowMarginProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" /> هوامش ربح جميع المنتجات مقبولة
                </p>
              ) : (
                <ul className="space-y-2">
                  {lowMarginProducts.map(p => (
                    <li key={p.id} className="flex items-center justify-between">
                      <span className="text-sm">{p.name}</span>
                      <span className="text-xs text-success bg-success/10 px-2 py-0.5 rounded-full font-medium">
                        مقترح: {format(getSuggestedPrice(p.costPerUnit, 20))}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </div>
    </ProGate>
  );
}
