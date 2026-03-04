import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Search,
  Plus,
  Minus,
  Trash2,
  Receipt,
  Tag,
  X,
  CheckCircle2,
  Home,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useProducts } from "@/hooks/useProducts";
import { useAddSale } from "@/hooks/useSales";
import { useCustomers } from "@/hooks/useCustomers";
import { getCurrentDate, getCurrentTime, Product, SaleItem, settingsDB, Settings as SettingsType } from "@/lib/appDB";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/hooks/useCurrency";
import { PrintButton } from "@/components/PrintButton";

interface CartItem {
  product: Product;
  quantity: number;
}

interface CompletedSale {
  items: SaleItem[];
  total: number;
  discount?: number;
  totalProfit: number;
  paymentType: "cash" | "credit";
  customerName?: string;
  date: string;
  time: string;
}

export default function NewSale() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentType, setPaymentType] = useState<"cash" | "credit">("cash");
  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId] = useState<string | undefined>();
  const [discountType, setDiscountType] = useState<"amount" | "percent">("amount");
  const [discountValue, setDiscountValue] = useState("");
  const [saleCompleted, setSaleCompleted] = useState<CompletedSale | null>(null);
  const [storeInfo, setStoreInfo] = useState<SettingsType | null>(null);

  useEffect(() => {
    settingsDB.get().then(s => { if (s) setStoreInfo(s); });
  }, []);

  const { data: products = [] } = useProducts();
  const { data: customers = [] } = useCustomers();
  const addSale = useAddSale();
  const { currency, fmt } = useCurrency();
  const { t } = useTranslation();

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity < product.quantity) {
          return prev.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        return prev;
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.quantity) return item;
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const subtotal = cart.reduce((acc, item) => acc + item.product.salePrice * item.quantity, 0);
  const discountAmt = discountType === "percent"
    ? Math.round(subtotal * (parseFloat(discountValue) || 0) / 100)
    : (parseFloat(discountValue) || 0);
  const total = Math.max(0, subtotal - discountAmt);
  const totalProfit = cart.reduce((acc, item) =>
    acc + (item.product.salePrice - item.product.costPerUnit) * item.quantity, 0
  ) - discountAmt;

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) && p.quantity > 0
  );

  const handleConfirmSale = () => {
    if (cart.length === 0) return;

    const saleItems: SaleItem[] = cart.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      quantity: item.quantity,
      unitPrice: item.product.salePrice,
      costPerUnit: item.product.costPerUnit,
      profit: (item.product.salePrice - item.product.costPerUnit) * item.quantity,
    }));

    const completedData: CompletedSale = {
      items: saleItems,
      total,
      discount: discountAmt > 0 ? discountAmt : undefined,
      totalProfit,
      paymentType,
      customerName: customerName || undefined,
      date: getCurrentDate(),
      time: getCurrentTime(),
    };

    addSale.mutate({
      items: saleItems,
      total,
      discount: discountAmt > 0 ? discountAmt : undefined,
      totalProfit,
      paymentType,
      customerId: customerId || undefined,
      customerName: customerName || undefined,
      date: getCurrentDate(),
      time: getCurrentTime(),
    }, {
      onSuccess: () => {
        setSaleCompleted(completedData);
      }
    });
  };

  /* ── شاشة نجاح البيع ─────────────────────────────────────────────── */
  if (saleCompleted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8 gap-6 animate-fade-up">

        {/* أيقونة النجاح */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle2 className="w-14 h-14 text-success" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">تمت عملية البيع! ✅</h2>
          {saleCompleted.customerName && (
            <p className="text-sm text-muted-foreground">للزبون: {saleCompleted.customerName}</p>
          )}
        </div>

        {/* ملخص المبلغ */}
        <div className="w-full max-w-sm bg-card border border-border/50 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">طريقة الدفع</span>
            <span className={cn(
              "text-xs font-semibold px-3 py-1 rounded-full",
              saleCompleted.paymentType === "cash"
                ? "bg-success/10 text-success"
                : "bg-warning/10 text-warning"
            )}>
              {saleCompleted.paymentType === "cash" ? "نقدي" : "آجل (دين)"}
            </span>
          </div>
          {(saleCompleted.discount ?? 0) > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">الخصم</span>
              <span className="text-sm text-warning">-{fmt(saleCompleted.discount!)}</span>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-border/30 pt-2">
            <span className="font-semibold">الإجمالي</span>
            <span className="text-2xl font-bold gold-text">{fmt(saleCompleted.total)}</span>
          </div>
        </div>

        {/* الأصناف */}
        <div className="w-full max-w-sm space-y-1.5">
          {saleCompleted.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between bg-muted/50 rounded-xl px-3 py-2">
              <span className="text-sm">{item.productName}</span>
              <span className="text-xs text-muted-foreground">{item.quantity} × {fmt(item.unitPrice)}</span>
            </div>
          ))}
        </div>

        {/* أزرار التنقل */}
        <div className="w-full max-w-sm flex flex-col gap-3 pt-2">
          {/* طباعة */}
          {storeInfo ? (
            <PrintButton
              type="sale"
              data={saleCompleted as any}
              storeInfo={storeInfo}
              variant="full"
              className="w-full h-12 text-base"
            />
          ) : (
            <Button variant="outline" className="w-full h-12 gap-2" onClick={() => navigate("/printer")}>
              <Printer className="h-5 w-5" />
              طباعة الفاتورة
            </Button>
          )}

          {/* بيع جديد */}
          <Button
            variant="gold"
            className="w-full h-12 gap-2"
            onClick={() => {
              setSaleCompleted(null);
              setCart([]);
              setCustomerName("");
              setCustomerId(undefined);
              setDiscountValue("");
              setPaymentType("cash");
            }}
          >
            <Receipt className="h-5 w-5" />
            بيع جديد
          </Button>

          {/* الرئيسية */}
          <Button
            variant="ghost"
            className="w-full h-11 gap-2 text-muted-foreground"
            onClick={() => navigate("/")}
          >
            <Home className="h-4 w-4" />
            الرئيسية
          </Button>
        </div>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 safe-top">
        <div className="bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowRight className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">{t('newSale.title')}</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-4 space-y-4 pb-48">
        {/* Search & QR */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('newSale.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border/50"
            />
          </div>

        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 gap-2">
          {filteredProducts.map((product) => {
            const inCart = cart.find(c => c.product.id === product.id);
            return (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className={cn(
                  "bg-card border border-border/50 rounded-xl p-3 text-right",
                  "transition-all duration-300 hover:border-primary/50 active:scale-95",
                  inCart && "border-primary bg-primary/5"
                )}
              >
                <p className="font-medium text-sm text-foreground truncate">
                  {product.name}
                </p>
                <p className="text-lg font-bold text-primary mt-1">
                  {fmt(product.salePrice)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('newSale.inStock')}: {product.quantity}
                  {inCart && <span className="text-primary mr-2">• {t('newSale.inCart')}: {inCart.quantity}</span>}
                </p>
              </button>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">{t('newSale.noProducts')}</p>
          </div>
        )}
      </main>

      {/* Cart Panel */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border/50 safe-bottom animate-slide-up">
          <div className="px-4 py-3 max-h-[40vh] overflow-y-auto">
            <h3 className="font-semibold text-foreground mb-3">
              {t('newSale.cartTitle', { count: cart.length })}
            </h3>
            
            <div className="space-y-2">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center gap-3 bg-muted/50 rounded-xl p-2"
                >
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">
                        {fmt(item.product.salePrice)}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => updateQuantity(item.product.id, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center font-bold">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => updateQuantity(item.product.id, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Discount */}
            <div className="mt-3 space-y-2">
              <div className="flex gap-2">
                <Button
                  variant={discountType === "amount" ? "primary" : "outline"}
                  size="sm"
                  className="text-xs"
                  onClick={() => setDiscountType("amount")}
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {t('newSale.discountAmount', { currency })}
                </Button>
                <Button
                  variant={discountType === "percent" ? "primary" : "outline"}
                  size="sm"
                  className="text-xs"
                  onClick={() => setDiscountType("percent")}
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {t('newSale.discountPercent')}
                </Button>
              </div>
              <Input
                type="number"
                min="0"
                placeholder={discountType === "percent" ? "0%" : "0"}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="bg-background"
              />
            </div>

            {/* Customer Name */}
            <div className="mt-4 space-y-2">
              <Input
                placeholder={t('newSale.customerPlaceholder')}
                value={customerName}
                onChange={(e) => { setCustomerName(e.target.value); setCustomerId(undefined); }}
                className="bg-background"
              />
              {customers.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {customers.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { setCustomerName(c.name); setCustomerId(c.id); }}
                      className={cn(
                        "shrink-0 px-3 py-1 rounded-full text-xs border transition-all",
                        customerId === c.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card border-border text-muted-foreground"
                      )}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Type */}
            <div className="flex gap-2 mt-4">
              <Button
                variant={paymentType === "cash" ? "primary" : "outline"}
                className="flex-1"
                onClick={() => setPaymentType("cash")}
              >
                {t('newSale.paymentCash')}
              </Button>
              <Button
                variant={paymentType === "credit" ? "primary" : "outline"}
                className="flex-1"
                onClick={() => setPaymentType("credit")}
              >
                {t('newSale.paymentCredit')}
              </Button>
            </div>
          </div>

          {/* Total & Confirm */}
          <div className="px-4 pb-4 pt-2 border-t border-border/30">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-muted-foreground">{t('newSale.subtotal')}</span>
                {discountAmt > 0 && (
                  <p className="text-xs text-warning">{t('newSale.discount')}: -{fmt(discountAmt)}</p>
                )}
                <p className="text-xs text-success">{t('newSale.saleProfit')}: {fmt(Math.round(totalProfit))}</p>
              </div>
              <div className="text-right">
                {discountAmt > 0 && (
                  <p className="text-sm line-through text-muted-foreground">{fmt(subtotal)}</p>
                )}
                <span className="text-2xl font-bold gold-text">
                  {fmt(total)}
                </span>
              </div>
            </div>
            <Button 
              variant="gold" 
              size="xl" 
              className="w-full"
              onClick={handleConfirmSale}
              disabled={addSale.isPending}
            >
              <Receipt className="h-5 w-5" />
              {addSale.isPending ? t('newSale.confirming') : t('newSale.confirmSale')}
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
