import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Search,
  Plus,
  Filter,
  Package,
  ArrowUpDown,
  Trash2,
  Edit2,
  X,
  Layers3,
  Barcode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { useProducts, useDeleteProduct, useUpdateProduct } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/EmptyState";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Product, settingsDB } from "@/lib/appDB";
import { useCurrency } from "@/hooks/useCurrency";
import { useConfirmDialog } from "@/components/ConfirmDialog";
import { SkeletonList, SkeletonProduct } from "@/components/SkeletonCards";

type SortKey = "name" | "price" | "quantity" | "margin";

export default function Stock() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("الكل");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const { data: products = [], isLoading } = useProducts();
  const deleteProduct = useDeleteProduct();
  const updateProduct = useUpdateProduct();
  const { fmt } = useCurrency();
  const { confirm: confirmDlg, ConfirmDialog } = useConfirmDialog();
  const { t } = useTranslation();

  // Settings-driven low stock threshold
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  useEffect(() => {
    settingsDB.get().then(s => { if (s?.lowStockThreshold) setLowStockThreshold(s.lowStockThreshold); });
  }, []);

  // Quantity adjustment state
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [adjustDelta, setAdjustDelta] = useState("");

  const categories = [t('stock.all'), ...new Set(products.map(p => p.category))];

  const filteredProducts = products
    .filter((product) => {
      const matchesSearch   = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === t('stock.all') || product.category === selectedCategory;
      const matchesMin      = !minPrice || product.salePrice >= parseFloat(minPrice);
      const matchesMax      = !maxPrice || product.salePrice <= parseFloat(maxPrice);
      return matchesSearch && matchesCategory && matchesMin && matchesMax;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortBy === "name")     cmp = a.name.localeCompare(b.name);
      if (sortBy === "price")    cmp = a.salePrice - b.salePrice;
      if (sortBy === "quantity") cmp = a.quantity - b.quantity;
      if (sortBy === "margin")   cmp = profitMarginPercent(a) - profitMarginPercent(b);
      return sortAsc ? cmp : -cmp;
    });

  const totalValue   = products.reduce((acc, p) => acc + (p.quantity * p.salePrice), 0);
  const lowStockCount = products.filter((p) => p.quantity <= lowStockThreshold).length;

  const handleDelete = async (id: string) => {
    const ok = await confirmDlg(t('stock.deleteConfirm'), { variant: 'destructive', title: t('stock.deleteTitle'), confirmLabel: t('common.delete') });
    if (ok) deleteProduct.mutate(id);
  };

  const handleAdjust = () => {
    if (!adjustProduct) return;
    const delta = parseInt(adjustDelta, 10);
    if (isNaN(delta) || delta === 0) return;
    const newQty = Math.max(0, adjustProduct.quantity + delta);
    updateProduct.mutate({ id: adjustProduct.id, updates: { quantity: newQty } });
    setAdjustProduct(null);
    setAdjustDelta("");
  };

  function profitMarginPercent(product: Product) {
    if (product.costPerUnit <= 0) return 0;
    return Math.round(((product.salePrice - product.costPerUnit) / product.costPerUnit) * 100);
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 safe-top">
        <div className="bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">{t('stock.title')}</h1>
              <p className="text-xs text-muted-foreground">
                {t('stock.subtitle', { count: products.length, value: fmt(totalValue) })}
              </p>
            </div>
            <Button variant="gold" size="icon" asChild>
              <Link to="/stock/new">
                <Plus className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-4 space-y-4">
        {/* Search & Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('stock.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border/50"
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => setShowFilterSheet(true)}>
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setShowSortSheet(true)}>
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "gold" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="shrink-0"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Stats Bar */}
        {lowStockCount > 0 && (
          <div className="flex items-center gap-2 bg-warning/10 border border-warning/30 rounded-xl px-3 py-2">
            <Package className="h-4 w-4 text-warning" />
            <span className="text-sm text-warning font-medium">
              {t('stock.lowStockWarning', { count: lowStockCount })}
            </span>
          </div>
        )}

        {/* Products List */}
        <div className="space-y-3">
          {isLoading ? (
            <SkeletonList Component={SkeletonProduct} count={5} />
          ) : filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-card border border-border/50 rounded-2xl p-4 transition-all duration-300 hover:scale-[1.01]"
                onClick={() => setSelectedProduct(product)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{product.name}</h3>
                      {product.quantity <= lowStockThreshold && (
                        <span className="bg-warning/10 text-warning text-[10px] px-2 py-0.5 rounded-full">
                          {t('stock.lowStock')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{product.category}</p>
                    {product.barcode && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Barcode className="h-3 w-3" />{product.barcode}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm">
                        <span className="text-muted-foreground">{t('stock.quantity')}: </span>
                        <span className="font-bold">{product.quantity}</span>
                      </span>
                      <span className="text-sm">
                        <span className="text-muted-foreground">{t('stock.costPrice')}: </span>
                        <span className="font-bold">{Math.round(product.costPerUnit).toLocaleString()}</span>
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">
                      {fmt(product.salePrice)}
                    </p>
                    <p className={cn(
                      "text-xs font-medium",
                      profitMarginPercent(product) >= 20 ? "text-success" : "text-warning"
                    )}>
                      {t('stock.profitMargin')} {profitMarginPercent(product)}%
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-border/30">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={(e) => { e.stopPropagation(); setAdjustProduct(product); setAdjustDelta(""); }}
                >
                  <Layers3 className="h-4 w-4 mr-1" />
                  {t('stock.adjustQty')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={(e) => { e.stopPropagation(); navigate(`/stock/edit/${product.id}`); }}
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  {t('stock.edit')}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  onClick={(e) => { e.stopPropagation(); handleDelete(product.id); }}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  {t('stock.delete')}
                </Button>
              </div>
            </div>
            ))
          ) : (
            <EmptyState
              icon="📦"
              title={t('stock.emptyTitle')}
              description={t('stock.emptyDesc')}
              action={{ label: t('stock.emptyAction'), href: '/stock/new' }}
            />
          )}
        </div>
      </main>

      {/* Product Detail Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-[90%] rounded-2xl">
          <DialogHeader>
            <DialogTitle>{selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted p-3 rounded-xl">
                  <p className="text-muted-foreground">{t('stock.detailCategory')}</p>
                  <p className="font-semibold">{selectedProduct.category}</p>
                </div>
                <div className="bg-muted p-3 rounded-xl">
                  <p className="text-muted-foreground">{t('stock.detailQty')}</p>
                  <p className="font-semibold">{selectedProduct.quantity}</p>
                </div>
                <div className="bg-muted p-3 rounded-xl">
                  <p className="text-muted-foreground">{t('stock.detailCost')}</p>
                  <p className="font-semibold">{fmt(Math.round(selectedProduct.costPerUnit))}</p>
                </div>
                <div className="bg-muted p-3 rounded-xl">
                  <p className="text-muted-foreground">{t('stock.detailSalePrice')}</p>
                  <p className="font-semibold">{fmt(selectedProduct.salePrice)}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setSelectedProduct(null);
                    navigate(`/stock/edit/${selectedProduct.id}`);
                  }}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  {t('stock.edit')}
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {
                    setSelectedProduct(null);
                    handleDelete(selectedProduct.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('stock.delete')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <ConfirmDialog />

      {/* Quantity Adjustment Sheet */}
      <Sheet open={!!adjustProduct} onOpenChange={(o) => { if (!o) { setAdjustProduct(null); setAdjustDelta(""); } }}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>{t('stock.adjustTitle')} — {adjustProduct?.name}</SheetTitle>
          </SheetHeader>
          <div className="space-y-5 mt-5 pb-8">
            <div className="flex items-center justify-center gap-2 bg-card rounded-2xl p-4">
              <span className="text-muted-foreground text-sm">{t('stock.quantity')}:</span>
              <span className="text-2xl font-bold text-foreground">{adjustProduct?.quantity}</span>
            </div>

            <div className="space-y-2">
              <Label>{t('stock.adjustPlaceholder')}</Label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setAdjustDelta(v => String((parseInt(v, 10) || 0) - 1))}
                >-</Button>
                <Input
                  type="number"
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(e.target.value)}
                  className="text-center text-lg font-bold"
                  placeholder="0"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setAdjustDelta(v => String((parseInt(v, 10) || 0) + 1))}
                >+</Button>
              </div>
              {adjustDelta && !isNaN(parseInt(adjustDelta, 10)) && (
                <p className="text-xs text-center text-muted-foreground">
                  {t('stock.quantity')} ({t('common.confirm')}):{" "}
                  <span className="font-bold text-foreground">
                    {Math.max(0, (adjustProduct?.quantity ?? 0) + parseInt(adjustDelta, 10))}
                  </span>
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setAdjustProduct(null); setAdjustDelta(""); }}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="gold"
                className="flex-1"
                disabled={!adjustDelta || adjustDelta === "0" || isNaN(parseInt(adjustDelta, 10))}
                onClick={handleAdjust}
              >
                {t('common.save')}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Filter Sheet */}
      <Sheet open={showFilterSheet} onOpenChange={setShowFilterSheet}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>{t('stock.filterTitle')}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4 pb-8">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>{t('stock.minPrice')}</Label>
                <Input type="number" placeholder="0" value={minPrice} onChange={e => setMinPrice(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>{t('stock.maxPrice')}</Label>
                <Input type="number" placeholder="0" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setMinPrice(""); setMaxPrice(""); setShowFilterSheet(false); }}>
                <X className="h-4 w-4 mr-1" />{t('common.cancel')}
              </Button>
              <Button variant="gold" className="flex-1" onClick={() => setShowFilterSheet(false)}>{t('common.confirm')}</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Sort Sheet */}
      <Sheet open={showSortSheet} onOpenChange={setShowSortSheet}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>{t('stock.sortTitle')}</SheetTitle>
          </SheetHeader>
          <div className="space-y-2 mt-4 pb-8">
            {([
              { key: "name",     label: t('stock.sortName') },
              { key: "price",    label: t('stock.sortPrice') },
              { key: "quantity", label: t('stock.sortQty') },
              { key: "margin",   label: t('stock.sortMargin') },
            ] as { key: SortKey; label: string }[]).map(opt => (
              <button
                key={opt.key}
                onClick={() => { setSortBy(opt.key); setSortAsc(sortBy === opt.key ? !sortAsc : true); setShowSortSheet(false); }}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all",
                  sortBy === opt.key ? "border-accent bg-accent/10" : "border-border"
                )}
              >
                <span>{opt.label}</span>
                {sortBy === opt.key && (
                  <span className="text-accent text-xs">{sortAsc ? `↑ ${t('stock.ascending')}` : `↓ ${t('stock.descending')}`}</span>
                )}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
