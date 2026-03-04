import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  Package,
  Calculator,
  Save,
  Loader2,
  Barcode,
  AlertTriangle,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProduct, useUpdateProduct } from "@/hooks/useProducts";
import { useCurrency } from "@/hooks/useCurrency";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CATEGORIES = [
  "ملابس رجالية", "ملابس نسائية", "ملابس أطفال",
  "إلكترونيات", "مواد غذائية", "منظفات",
  "أدوات منزلية", "مستحضرات تجميل", "ألعاب",
  "مجوهرات وإكسسوارات", "أحذية", "حقائب", "عام",
];

export default function EditProduct() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currency } = useCurrency();
  const { data: product, isLoading } = useProduct(id ?? "");
  const updateProduct = useUpdateProduct();

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    customCategory: "",
    quantity: "",
    purchasePrice: "",
    transportCost: "",
    extraCosts: "",
    salePrice: "",
    profitMargin: "30",
    paymentType: "cash" as "cash" | "credit",
    supplier: "",
    barcode: "",
    minStock: "",
  });

  const [manualPrice, setManualPrice] = useState(false);

  /* ── Populate form when product loads ── */
  useEffect(() => {
    if (!product) return;
    const knownCat = CATEGORIES.includes(product.category);
    setFormData({
      name:          product.name,
      category:      knownCat ? product.category : "أخرى",
      customCategory: knownCat ? "" : product.category,
      quantity:      String(product.quantity),
      purchasePrice: String(product.purchasePrice),
      transportCost: String(product.transportCost),
      extraCosts:    String(product.extraCosts),
      salePrice:     String(product.salePrice),
      profitMargin:  String(product.profitMargin),
      paymentType:   product.paymentType,
      supplier:      product.supplier  ?? "",
      barcode:       product.barcode   ?? "",
      minStock:      product.minStock != null ? String(product.minStock) : "",
    });
    setManualPrice(true);
  }, [product]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      // Auto-recalculate suggested price unless user has manually set one
      if (!manualPrice && ["purchasePrice", "transportCost", "extraCosts", "quantity", "profitMargin"].includes(field)) {
        const qty  = parseFloat(field === "quantity"      ? value : prev.quantity)      || 0;
        const pp   = parseFloat(field === "purchasePrice" ? value : prev.purchasePrice) || 0;
        const tc   = parseFloat(field === "transportCost" ? value : prev.transportCost) || 0;
        const ec   = parseFloat(field === "extraCosts"    ? value : prev.extraCosts)    || 0;
        const pm   = parseFloat(field === "profitMargin"  ? value : prev.profitMargin)  || 0;
        const cpu  = qty > 0 ? (pp + tc + ec) / qty : 0;
        updated.salePrice = String(Math.round(cpu * (1 + pm / 100)));
      }
      return updated;
    });
  };

  /* ── Derived calculations ── */
  const quantity      = parseFloat(formData.quantity)      || 0;
  const purchasePrice = parseFloat(formData.purchasePrice) || 0;
  const transportCost = parseFloat(formData.transportCost) || 0;
  const extraCosts    = parseFloat(formData.extraCosts)    || 0;
  const totalCost     = purchasePrice + transportCost + extraCosts;
  const costPerUnit   = quantity > 0 ? totalCost / quantity : 0;
  const salePrice     = parseFloat(formData.salePrice)     || 0;
  const profitPerUnit = salePrice - costPerUnit;
  const marginPercent = costPerUnit > 0 ? Math.round((profitPerUnit / costPerUnit) * 100) : 0;

  const effectiveCategory =
    formData.category === "أخرى" ? formData.customCategory : formData.category;

  const handleSubmit = async () => {
    if (!formData.name || quantity <= 0 || purchasePrice <= 0 || salePrice <= 0) {
      toast.error("يرجى ملء جميع الحقول الإلزامية");
      return;
    }
    if (!id) return;

    updateProduct.mutate({
      id,
      updates: {
        name:          formData.name,
        category:      effectiveCategory || "عام",
        quantity,
        purchasePrice,
        transportCost,
        extraCosts,
        costPerUnit,
        salePrice,
        profitMargin:  parseFloat(formData.profitMargin) || 0,
        paymentType:   formData.paymentType,
        supplier:      formData.supplier.trim()    || undefined,
        barcode:       formData.barcode.trim()     || undefined,
        minStock:      formData.minStock ? parseFloat(formData.minStock) : undefined,
      },
    }, {
      onSuccess: () => navigate("/stock"),
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">المنتج غير موجود</p>
        <Button onClick={() => navigate("/stock")}>العودة للمخزون</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 safe-top">
        <div className="bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowRight className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">تعديل المنتج</h1>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6 pb-32">
        {/* Basic Info */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            معلومات المنتج
          </h2>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم المنتج *</Label>
              <Input
                id="name"
                placeholder="مثال: قميص رجالي أزرق"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="bg-card border-border/50"
              />
            </div>

            {/* Category selector */}
            <div className="space-y-2">
              <Label>الفئة</Label>
              <div className="flex flex-wrap gap-2">
                {[...CATEGORIES, "أخرى"].map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleChange("category", cat)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm border-2 transition-all",
                      formData.category === cat
                        ? "border-accent bg-accent/10 text-accent font-semibold"
                        : "border-border text-muted-foreground hover:border-accent/40",
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              {formData.category === "أخرى" && (
                <Input
                  placeholder="اكتب اسم الفئة..."
                  value={formData.customCategory}
                  onChange={(e) => handleChange("customCategory", e.target.value)}
                  className="mt-2 bg-card border-border/50"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">الكمية *</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                placeholder="0"
                value={formData.quantity}
                onChange={(e) => handleChange("quantity", e.target.value)}
                className="bg-card border-border/50 text-lg font-bold"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier" className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                اسم المورد (اختياري)
              </Label>
              <Input
                id="supplier"
                placeholder="مثال: شركة الأطلس"
                value={formData.supplier}
                onChange={(e) => handleChange("supplier", e.target.value)}
                className="bg-card border-border/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="barcode" className="flex items-center gap-2">
                  <Barcode className="h-4 w-4 text-muted-foreground" />
                  باركود
                </Label>
                <Input
                  id="barcode"
                  placeholder="اختياري"
                  value={formData.barcode}
                  onChange={(e) => handleChange("barcode", e.target.value)}
                  className="bg-card border-border/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minStock" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  حد التنبيه
                </Label>
                <Input
                  id="minStock"
                  type="number"
                  placeholder="5"
                  value={formData.minStock}
                  onChange={(e) => handleChange("minStock", e.target.value)}
                  className="bg-card border-border/50"
                />
              </div>
            </div>

          </div>
        </section>

        {/* Costs */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Calculator className="h-5 w-5 text-accent" />
            التكاليف
          </h2>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="purchasePrice">سعر الشراء الإجمالي *</Label>
              <div className="relative">
                <Input
                  id="purchasePrice"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.purchasePrice}
                  onChange={(e) => { setManualPrice(false); handleChange("purchasePrice", e.target.value); }}
                  className="bg-card border-border/50 text-lg font-bold pl-14"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  {currency}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="transportCost">تكلفة النقل</Label>
                <Input
                  id="transportCost"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.transportCost}
                  onChange={(e) => { setManualPrice(false); handleChange("transportCost", e.target.value); }}
                  className="bg-card border-border/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="extraCosts">تكاليف إضافية</Label>
                <Input
                  id="extraCosts"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.extraCosts}
                  onChange={(e) => { setManualPrice(false); handleChange("extraCosts", e.target.value); }}
                  className="bg-card border-border/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profitMargin">هامش الربح المطلوب (%)</Label>
              <Input
                id="profitMargin"
                type="number"
                min="0"
                placeholder="30"
                value={formData.profitMargin}
                onChange={(e) => { setManualPrice(false); handleChange("profitMargin", e.target.value); }}
                className="bg-card border-border/50"
              />
            </div>

            {/* Manual sale price override */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="salePrice">سعر البيع الفعلي *</Label>
                <span className="text-xs text-accent">قابل للتعديل</span>
              </div>
              <div className="relative">
                <Input
                  id="salePrice"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.salePrice}
                  onChange={(e) => { setManualPrice(true); handleChange("salePrice", e.target.value); }}
                  className="bg-card border-border/50 text-xl font-bold text-accent pl-14"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  {currency}
                </span>
              </div>
            </div>

            {/* Payment type */}
            <div className="space-y-2">
              <Label>طريقة الشراء</Label>
              <div className="flex gap-2">
                {(["cash", "credit"] as const).map(pt => (
                  <Button
                    key={pt}
                    type="button"
                    variant={formData.paymentType === pt ? "primary" : "outline"}
                    className="flex-1"
                    onClick={() => handleChange("paymentType", pt)}
                  >
                    {pt === "cash" ? "نقدي" : "دين"}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Summary */}
        {quantity > 0 && purchasePrice > 0 && salePrice > 0 && (
          <section className="bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-4 space-y-4">
            <h3 className="font-semibold text-foreground">ملخص الحسابات</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background/50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground">التكلفة الإجمالية</p>
                <p className="text-lg font-bold">{totalCost.toLocaleString()} {currency}</p>
              </div>
              <div className="bg-background/50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground">تكلفة الوحدة</p>
                <p className="text-lg font-bold">{Math.round(costPerUnit).toLocaleString()} {currency}</p>
              </div>
            </div>
            <div className={cn(
              "border rounded-xl p-4",
              marginPercent >= 15 ? "bg-success/10 border-success/30" : "bg-warning/10 border-warning/30",
            )}>
              <p className="text-sm text-muted-foreground">ربح الوحدة</p>
              <p className={cn("text-2xl font-bold", marginPercent >= 15 ? "text-success" : "text-warning")}>
                {Math.round(profitPerUnit).toLocaleString()} {currency}
              </p>
              <p className="text-xs text-muted-foreground mt-1">هامش: {marginPercent}%</p>
            </div>
          </section>
        )}
      </main>

      {/* Save button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border/50 safe-bottom">
        <Button
          variant="gold"
          size="xl"
          className="w-full"
          disabled={!formData.name || !formData.quantity || !formData.purchasePrice || !formData.salePrice || updateProduct.isPending}
          onClick={handleSubmit}
        >
          {updateProduct.isPending ? (
            <><Loader2 className="h-5 w-5 animate-spin" /> جاري الحفظ...</>
          ) : (
            <><Save className="h-5 w-5" /> حفظ التعديلات</>
          )}
        </Button>
      </div>
    </div>
  );
}
