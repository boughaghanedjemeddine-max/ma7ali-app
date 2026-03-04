import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Search,
  Plus,
  Filter,
  ShoppingCart,
  TrendingUp,
  Trash2,
  ChevronDown,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { useSales, useDeleteSale, useTodayStats } from "@/hooks/useSales";
import { Sale, getCurrentDate, Settings as SettingsType } from "@/lib/appDB";
import { settingsDB } from "@/lib/appDB";
import { PrintButton } from "@/components/PrintButton";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/EmptyState";
import { useCurrency } from "@/hooks/useCurrency";
import { useConfirmDialog } from "@/components/ConfirmDialog";
import { SkeletonList, SkeletonSaleCard } from "@/components/SkeletonCards";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useEffect } from "react";

const getPeriods = (t: (k: string) => string) => [
  t('sales.periodToday'), t('sales.periodWeek'), t('sales.periodMonth'), t('sales.periodAll')
];

export default function Sales() {
  const { t } = useTranslation();
  const periods = getPeriods(t);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [storeInfo, setStoreInfo] = useState<SettingsType | null>(null);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]   = useState("");

  const { data: sales = [], isLoading } = useSales();
  const { data: todayStats } = useTodayStats();
  const deleteSale = useDeleteSale();
  const { fmt } = useCurrency();
  const { confirm: confirmDlg, ConfirmDialog } = useConfirmDialog();

  useEffect(() => {
    settingsDB.get().then(s => { if (s) setStoreInfo(s); });
  }, []);

  // Set default period once translations are available
  useEffect(() => {
    if (!selectedPeriod) setSelectedPeriod(t('sales.periodToday'));
  }, [t, selectedPeriod]);

  const today = getCurrentDate();
  
  // Filter sales by period
  const getFilteredSales = () => {
    let filtered = [...sales];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(s => 
        s.items.some(item => item.productName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.customerName && s.customerName.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Apply period filter
    if (selectedPeriod === t('sales.periodToday')) {
      filtered = filtered.filter(s => s.date === today);
    } else if (selectedPeriod === t('sales.periodWeek')) {
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(s => new Date(s.date) >= weekAgo);
    } else if (selectedPeriod === t('sales.periodMonth')) {
      const monthAgo = new Date(); monthAgo.setMonth(monthAgo.getMonth() - 1);
      filtered = filtered.filter(s => new Date(s.date) >= monthAgo);
    }
    if (dateFrom) filtered = filtered.filter(s => s.date >= dateFrom);
    if (dateTo)   filtered = filtered.filter(s => s.date <= dateTo);
    return filtered.sort((a, b) =>
      new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime()
    );
  };

  const filteredSales = getFilteredSales();

  // Group sales by date
  const groupedSales: Record<string, Sale[]> = {};
  filteredSales.forEach(sale => {
    if (!groupedSales[sale.date]) {
      groupedSales[sale.date] = [];
    }
    groupedSales[sale.date].push(sale);
  });

  const handleDelete = async (id: string) => {
    const ok = await confirmDlg(t('sales.deleteConfirm'), {
      variant: 'destructive', title: t('sales.deleteTitle'), confirmLabel: t('common.delete'),
    });
    if (ok) deleteSale.mutate(id);
  };

  const formatDateLabel = (date: string) => {
    if (date === today) return t('sales.labelToday');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date === yesterday.toISOString().split('T')[0]) return t('sales.labelYesterday');
    return date;
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 safe-top">
        <div className="bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">{t('sales.title')}</h1>
          <p className="text-xs text-muted-foreground">
                {t('sales.subtitle', { count: todayStats?.count || 0 })}
              </p>
            </div>
            <Button variant="gold" size="icon" asChild>
              <Link to="/sales/new">
                <Plus className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-4 space-y-4">
        {/* Today's Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-4">
            <p className="text-xs text-muted-foreground">{t('sales.todaySales')}</p>
            <p className="text-xl font-bold metallic-text mt-1">
              {fmt(todayStats?.total || 0)}
            </p>
          </div>
          <div className="bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 rounded-2xl p-4">
            <p className="text-xs text-muted-foreground">{t('sales.todayProfit')}</p>
            <p className="text-xl font-bold gold-text mt-1">
              {fmt(Math.round(todayStats?.profit || 0))}
            </p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('sales.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border/50"
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => setShowFilterSheet(true)}>
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setShowFilterSheet(true)}>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>

        {/* Period Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {periods.map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? "primary" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
              className="shrink-0"
            >
              {period}
            </Button>
          ))}
        </div>

        {/* Sales List */}
        <div className="space-y-4">
          {isLoading ? (
            <SkeletonList Component={SkeletonSaleCard} count={5} />
          ) : Object.keys(groupedSales).length > 0 ? (
            Object.entries(groupedSales).map(([date, dateSales]) => (
              <div key={date}>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  {formatDateLabel(date)}
                </h3>
                <div className="space-y-2">
                  {dateSales.map((sale) => {
                    const itemsText = sale.items.length === 1
                      ? sale.items[0].productName
                      : t('sales.items_other', { count: sale.items.length });

                    return (
                      <div 
                        key={sale.id}
                        className="bg-card border border-border/50 rounded-2xl p-4 transition-all duration-300 hover:scale-[1.01] cursor-pointer"
                        onClick={() => setSelectedSale(sale)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-foreground">{itemsText}</span>
                              <span className={cn(
                                "text-[10px] font-medium px-2 py-0.5 rounded-full",
                                sale.paymentType === "cash" 
                                  ? "bg-success/10 text-success" 
                                  : "bg-warning/10 text-warning"
                              )}>
                                {sale.paymentType === "cash" ? t('sales.cash') : t('sales.credit')}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {sale.time} • {sale.customerName || t('sales.customer')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-foreground">
                              {fmt(sale.total)}
                            </p>
                            <p className="text-xs text-success flex items-center justify-end gap-1 mt-0.5">
                              <TrendingUp className="h-3 w-3" />
                              +{fmt(Math.round(sale.totalProfit))}
                            </p>
                          </div>
                        </div>
                          <div className="flex justify-end mt-2 pt-2 border-t border-border/30 gap-1" onClick={e => e.stopPropagation()}>
                          {storeInfo && (
                            <PrintButton
                              type="sale"
                              data={sale}
                              storeInfo={storeInfo}
                              variant="icon"
                            />
                          )}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDelete(sale.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              icon="🛒"
              title={t('sales.emptyTitle')}
              description={t('sales.emptyDesc')}
              action={{ label: `➕ ${t('sales.newSale')}`, href: '/sales/new' }}
            />
          )}
        </div>
      </main>
      <ConfirmDialog />

      {/* Sale Detail Sheet */}
      <Sheet open={!!selectedSale} onOpenChange={(v) => !v && setSelectedSale(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t('common.details')}</SheetTitle>
          </SheetHeader>
          {selectedSale && (
            <div className="space-y-3 mt-4 pb-8">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{selectedSale.date} • {selectedSale.time}</span>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-medium",
                  selectedSale.paymentType === 'cash' ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                )}>
                  {selectedSale.paymentType === 'cash' ? t('sales.cash') : t('sales.credit')}
                </span>
              </div>
              {selectedSale.customerName && (
                <p className="text-sm text-muted-foreground">{t('sales.customer')}: {selectedSale.customerName}</p>
              )}
              <div className="space-y-2">
                {selectedSale.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-muted/50 rounded-xl px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">{fmt(item.unitPrice)} × {item.quantity}</p>
                    </div>
                    <p className="font-bold">{fmt(item.unitPrice * item.quantity)}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-border/50 pt-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('common.total')}</p>
                  <p className="text-xs text-success">{t('common.profit')}: {fmt(Math.round(selectedSale.totalProfit))}</p>
                </div>
                <p className="text-2xl font-bold gold-text">{fmt(selectedSale.total)}</p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Date Filter Sheet */}
      <Sheet open={showFilterSheet} onOpenChange={setShowFilterSheet}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>{t('sales.filterTitle')}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4 pb-8">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{t('sales.dateFrom')}</Label>
                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>{t('sales.dateTo')}</Label>
                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setDateFrom(""); setDateTo(""); setShowFilterSheet(false); }}>
                <X className="h-4 w-4 mr-1" />{t('sales.resetFilter')}
              </Button>
              <Button variant="gold" className="flex-1" onClick={() => setShowFilterSheet(false)}>{t('sales.applyFilter')}</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
