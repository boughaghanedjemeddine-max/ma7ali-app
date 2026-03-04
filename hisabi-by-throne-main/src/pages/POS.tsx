import { useState, useMemo, useRef, useEffect } from "react";
import {
  Search, ShoppingCart, Minus, Plus, Trash2, X, Check,
  Zap, ChevronUp, ChevronDown, User, Percent, Barcode,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProducts } from "@/hooks/useProducts";
import { useAddSale } from "@/hooks/useSales";
import { useCustomers } from "@/hooks/useCustomers";
import { useCurrency } from "@/hooks/useCurrency";
import { getCurrentDate, getCurrentTime, Product, SaleItem } from "@/lib/appDB";
import { printPOSReceipt } from "@/lib/printPOSReceipt";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CartItem {
  product: Product;
  quantity: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  "ملابس رجالية":       "from-blue-500 to-blue-600",
  "ملابس نسائية":       "from-pink-500 to-pink-600",
  "ملابس أطفال":        "from-purple-500 to-purple-600",
  "إلكترونيات":         "from-cyan-500 to-cyan-600",
  "مواد غذائية":        "from-green-500 to-green-600",
  "منظفات":             "from-teal-500 to-teal-600",
  "أدوات منزلية":       "from-orange-500 to-orange-600",
  "مستحضرات تجميل":    "from-rose-500 to-rose-600",
  "ألعاب":              "from-yellow-500 to-yellow-600",
  "مجوهرات وإكسسوارات":"from-amber-500 to-amber-600",
  "أحذية":              "from-stone-500 to-stone-600",
  "حقائب":              "from-lime-500 to-lime-600",
};
const DEFAULT_GRADIENT = "from-slate-500 to-slate-600";

export default function POS() {
  const navigate       = useNavigate();
  const { data: products = [] } = useProducts();
  const addSale              = useAddSale();
  const { data: customers = [] } = useCustomers();
  const { fmt, currency }   = useCurrency();

  const [search, setSearch]             = useState("");
  const [selectedCat, setSelectedCat]  = useState("الكل");
  const [cart, setCart]                 = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen]         = useState(false);
  const [discount, setDiscount]         = useState("");
  const [discountPct, setDiscountPct]   = useState(false);
  const [paymentType, setPaymentType]   = useState<"cash" | "credit">("cash");
  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId]     = useState<string | undefined>();
  const [showSuccess, setShowSuccess]   = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const inStockProducts = products.filter(p => p.quantity > 0);
  const categories = ["الكل", ...new Set(inStockProducts.map(p => p.category))];

  const filtered = useMemo(() => inStockProducts.filter(p => {
    const matchCat = selectedCat === "الكل" || p.category === selectedCat;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                       (p.barcode && p.barcode.includes(search));
    return matchCat && matchSearch;
  }), [inStockProducts, selectedCat, search]);

  const totalItems   = cart.reduce((acc, c) => acc + c.quantity, 0);
  const subtotal     = cart.reduce((acc, c) => acc + c.product.salePrice * c.quantity, 0);
  const discountAmt  = discountPct
    ? Math.round(subtotal * (parseFloat(discount) || 0) / 100)
    : parseFloat(discount) || 0;
  const total        = Math.max(0, subtotal - discountAmt);
  const totalProfit  = cart.reduce((acc, c) =>
    acc + (c.product.salePrice - c.product.costPerUnit) * c.quantity, 0) - discountAmt;

  const addToCart = (product: Product) => {
    setCart(prev => {
      const exists = prev.find(c => c.product.id === product.id);
      if (exists) {
        return prev.map(c => c.product.id === product.id
          ? { ...c, quantity: Math.min(c.quantity + 1, product.quantity) }
          : c);
      }
      return [...prev, { product, quantity: 1 }];
    });
    // vibrate feedback
    if (navigator.vibrate) navigator.vibrate(30);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(c => c.product.id !== productId));
  };

  const updateQty = (productId: string, delta: number) => {
    setCart(prev => prev.map(c => {
      if (c.product.id !== productId) return c;
      const newQty = c.quantity + delta;
      if (newQty <= 0) return c; // don't go below 1 here; use remove button
      return { ...c, quantity: Math.min(newQty, c.product.quantity) };
    }));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) { toast.error("السلة فارغة"); return; }
    if (paymentType === 'credit' && !customerName.trim()) {
      toast.error("أدخل اسم الزبون للبيع الآجل"); return;
    }

    const saleItems: Omit<SaleItem, never>[] = cart.map(c => ({
      productId:   c.product.id,
      productName: c.product.name,
      quantity:    c.quantity,
      unitPrice:   c.product.salePrice,
      costPerUnit: c.product.costPerUnit,
      profit:      (c.product.salePrice - c.product.costPerUnit) * c.quantity,
    }));

    const saleDate = getCurrentDate();
    const saleTime = getCurrentTime();

    await addSale.mutateAsync({
      items:        saleItems,
      total,
      discount:     discountAmt || undefined,
      totalProfit,
      paymentType,
      customerId:   customerId || undefined,
      customerName: customerName || undefined,
      date:         saleDate,
      time:         saleTime,
    });

    // Open thermal receipt in new window
    printPOSReceipt({
      items: cart.map(c => ({
        name:      c.product.name,
        quantity:  c.quantity,
        unitPrice: c.product.salePrice,
      })),
      subtotal,
      discountAmt,
      total,
      paymentType,
      customerName: customerName || undefined,
      date: saleDate,
      time: saleTime,
    });

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setCart([]);
      setDiscount("");
      setCustomerName("");
      setCustomerId(undefined);
      setCartOpen(false);
    }, 1600);
  };

  // Barcode scan: press Enter in search to find exact barcode match
  const handleSearchKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && search.trim()) {
      const match = products.find(p => p.barcode === search.trim());
      if (match) {
        addToCart(match);
        setSearch("");
        toast.success(`${match.name} أضيف إلى السلة`);
      }
    }
  };

  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50">
        <div className="w-24 h-24 rounded-full bg-success/20 flex items-center justify-center mb-6 animate-scale-in">
          <Check className="w-12 h-12 text-success" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">تمت العملية!</h2>
        <p className="text-muted-foreground mt-2">{fmt(total)}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 safe-top bg-background/90 backdrop-blur-xl border-b border-border/50">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <X className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2 bg-muted/60 rounded-xl px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                ref={searchRef}
                placeholder="ابحث باسم المنتج أو الباركود..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={handleSearchKey}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {search && (
                <button onClick={() => setSearch("")}>
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* Cart badge */}
          <button
            className="relative w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart className="w-5 h-5 text-accent" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
        </div>

        {/* Category pills */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                selectedCat === cat
                  ? "bg-accent text-accent-foreground border-accent"
                  : "bg-card border-border text-muted-foreground"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {/* ── Product Grid ── */}
      <main className="flex-1 px-3 py-3 pb-28">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Barcode className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>لا توجد منتجات</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {filtered.map(product => {
            const inCart = cart.find(c => c.product.id === product.id);
            const gradient = CATEGORY_COLORS[product.category] || DEFAULT_GRADIENT;

            return (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className={cn(
                  "relative rounded-2xl overflow-hidden text-white text-left transition-all active:scale-95",
                  `bg-gradient-to-br ${gradient}`
                )}
              >
                <div className="p-4">
                  <p className="font-bold text-base leading-tight mb-1 line-clamp-2">{product.name}</p>
                  <p className="text-white/80 text-xs mb-3">{product.category}</p>
                  <p className="text-xl font-bold">{fmt(product.salePrice)}</p>
                  <p className="text-white/70 text-xs mt-1">متاح: {product.quantity}</p>
                </div>

                {inCart && (
                  <div className="absolute top-2 left-2 w-6 h-6 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{inCart.quantity}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </main>

      {/* ── Checkout Bar (bottom) ── */}
      {totalItems > 0 && !cartOpen && (
        <div className="fixed bottom-[72px] left-0 right-0 px-4 pb-2 z-30">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full bg-accent text-accent-foreground rounded-2xl p-4 flex items-center justify-between font-bold text-lg"
          >
            <span className="bg-white/20 rounded-xl px-2.5 py-0.5 text-sm font-bold">{totalItems}</span>
            <span>عرض السلة</span>
            <span>{fmt(total)}</span>
          </button>
        </div>
      )}

      {/* ── Cart Drawer ── */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex flex-col">
          {/* Overlay */}
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setCartOpen(false)} />

          {/* Panel */}
          <div className="bg-background rounded-t-3xl safe-bottom max-h-[85vh] flex flex-col">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            <div className="px-4 pb-2 flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-accent" />
                السلة ({totalItems})
              </h2>
              <button onClick={() => setCartOpen(false)}>
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto px-4 space-y-2">
              {cart.map(item => (
                <div key={item.product.id} className="flex items-center gap-3 p-3 bg-muted/40 rounded-2xl">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">{fmt(item.product.salePrice)} / قطعة</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQty(item.product.id, -1)}
                      disabled={item.quantity <= 1}
                      className="w-7 h-7 rounded-full bg-muted flex items-center justify-center disabled:opacity-40"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.product.id, 1)}
                      disabled={item.quantity >= item.product.quantity}
                      className="w-7 h-7 rounded-full bg-accent/20 text-accent flex items-center justify-center disabled:opacity-40"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <span className="font-bold text-sm w-20 text-right">
                    {fmt(item.product.salePrice * item.quantity)}
                  </span>

                  <button onClick={() => removeFromCart(item.product.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              ))}
            </div>

            {/* Checkout form */}
            <div className="px-4 pt-4 pb-[84px] space-y-3 border-t border-border/30">

              {/* Discount */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="خصم"
                    value={discount}
                    onChange={e => setDiscount(e.target.value)}
                    className="h-11"
                  />
                </div>
                <Button
                  variant={discountPct ? "primary" : "outline"}
                  size="sm"
                  className="h-11 px-3"
                  onClick={() => setDiscountPct(p => !p)}
                >
                  <Percent className="w-4 h-4" />
                </Button>
              </div>

              {/* Payment type */}
              <div className="flex gap-2">
                <Button
                  variant={paymentType === 'cash' ? "primary" : "outline"}
                  className="flex-1"
                  onClick={() => setPaymentType('cash')}
                >
                  نقداً
                </Button>
                <Button
                  variant={paymentType === 'credit' ? "primary" : "outline"}
                  className="flex-1"
                  onClick={() => setPaymentType('credit')}
                >
                  آجل
                </Button>
              </div>

              {paymentType === 'credit' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 bg-muted/40 rounded-xl px-3 py-2">
                    <User className="w-4 h-4 text-muted-foreground shrink-0" />
                    <input
                      placeholder="اسم الزبون *"
                      value={customerName}
                      onChange={e => { setCustomerName(e.target.value); setCustomerId(undefined); }}
                      className="flex-1 bg-transparent text-sm outline-none"
                    />
                  </div>
                  {customers.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto scrollbar-none">
                      {customers.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => { setCustomerName(c.name); setCustomerId(c.id); }}
                          className={cn(
                            "shrink-0 px-3 py-1 rounded-full text-xs border transition-all",
                            customerId === c.id
                              ? "bg-accent text-accent-foreground border-accent"
                              : "bg-card border-border text-muted-foreground"
                          )}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Totals */}
              {discountAmt > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>المجموع قبل الخصم</span>
                  <span>{fmt(subtotal)}</span>
                </div>
              )}
              {discountAmt > 0 && (
                <div className="flex justify-between text-sm text-destructive">
                  <span>الخصم</span>
                  <span>- {fmt(discountAmt)}</span>
                </div>
              )}

              {/* Pay button */}
              <Button
                variant="gold"
                size="xl"
                className="w-full font-bold text-lg h-14"
                disabled={addSale.isPending}
                onClick={handleCheckout}
              >
                <Zap className="w-5 h-5" />
                دفع {fmt(total)}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
