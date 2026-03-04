import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Package,
  Calculator,
  Save,
  Truck,
  Barcode,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAddProduct } from "@/hooks/useProducts";
import { useCurrency } from "@/hooks/useCurrency";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function NewProduct() {
  const navigate = useNavigate();
  const addProduct = useAddProduct();
  const { currency } = useCurrency();
  const { t } = useTranslation();

  const CATEGORIES = [...t('newProduct.categories').split(','), t('newProduct.other')];

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

  const handleChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (!manualPrice && ["purchasePrice","transportCost","extraCosts","quantity","profitMargin"].includes(field)) {
        const qty = parseFloat(field === "quantity"       ? value : prev.quantity)       || 0;
        const pp  = parseFloat(field === "purchasePrice"  ? value : prev.purchasePrice)  || 0;
        const tc  = parseFloat(field === "transportCost"  ? value : prev.transportCost)  || 0;
        const ec  = parseFloat(field === "extraCosts"     ? value : prev.extraCosts)     || 0;
        const pm  = parseFloat(field === "profitMargin"   ? value : prev.profitMargin)   || 0;
        const cpu = qty > 0 ? (pp + tc + ec) / qty : 0;
        updated.salePrice = String(Math.round(cpu * (1 + pm / 100)));
      }
      return updated;
    });
  };

  const quantity      = parseFloat(formData.quantity)      || 0;
  const purchasePrice = parseFloat(formData.purchasePrice) || 0;
  const transportCost = parseFloat(formData.transportCost) || 0;
  const extraCosts    = parseFloat(formData.extraCosts)    || 0;
  const totalCost     = purchasePrice + transportCost + extraCosts;
  const costPerUnit   = quantity > 0 ? totalCost / quantity : 0;
  const salePrice     = parseFloat(formData.salePrice)     || 0;
  const profitPerUnit = salePrice - costPerUnit;
  const marginPct     = costPerUnit > 0 ? Math.round((profitPerUnit / costPerUnit) * 100) : 0;

  const effectiveCategory = formData.category === t('newProduct.other') ? formData.customCategory : formData.category;

  const handleSubmit = () => {
    if (!formData.name || quantity <= 0 || purchasePrice <= 0 || salePrice <= 0) {
      toast.error(t('newProduct.errorRequired'));
      return;
    }
    addProduct.mutate({
      name:         formData.name,
      category:     effectiveCategory || t('newProduct.categories').split(',').at(-1) || 'عام',
      quantity,
      purchasePrice,
      transportCost,
      extraCosts,
      costPerUnit,
      salePrice,
      profitMargin: parseFloat(formData.profitMargin) || 0,
      paymentType:  formData.paymentType,
      supplier:     formData.supplier.trim()    || undefined,
      barcode:      formData.barcode.trim()     || undefined,
      minStock:     formData.minStock ? parseFloat(formData.minStock) : undefined,
    }, {
      onSuccess: () => navigate("/stock"),
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 safe-top">
        <div className="bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowRight className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">{t('newProduct.title')}</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 space-y-6 pb-32">
        {/* Basic Info */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {t('newProduct.sectionInfo')}
          </h2>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('newProduct.productName')} *</Label>
              <Input
                id="name"
                placeholder={t('newProduct.productNamePlaceholder')}
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="bg-card border-border/50"
              />
            </div>

            <div className="space-y-2">
              <Label>{t('newProduct.category')}</Label>
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
              {formData.category === t('newProduct.other') && (
                <Input
                  placeholder={t('newProduct.writeCategoryPlaceholder')}
                  value={formData.customCategory}
                  onChange={(e) => handleChange("customCategory", e.target.value)}
                  className="mt-2 bg-card border-border/50"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">{t('newProduct.quantity')} *</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="0"
                value={formData.quantity}
                onChange={(e) => handleChange("quantity", e.target.value)}
                className="bg-card border-border/50 text-lg font-bold"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier" className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                {t('newProduct.supplier')}
              </Label>
              <Input
                id="supplier"
                placeholder={t('newProduct.supplierPlaceholder')}
                value={formData.supplier}
                onChange={(e) => handleChange("supplier", e.target.value)}
                className="bg-card border-border/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="barcode" className="flex items-center gap-2">
                  <Barcode className="h-4 w-4 text-muted-foreground" />
                  {t('newProduct.barcode')}
                </Label>
                <Input
                  id="barcode"
                  placeholder={t('newProduct.barcodePlaceholder')}
                  value={formData.barcode}
                  onChange={(e) => handleChange("barcode", e.target.value)}
                  className="bg-card border-border/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minStock" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  {t('newProduct.minStock')}
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
            {t('newProduct.sectionCosts')}
          </h2>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="purchasePrice">{t('newProduct.purchasePrice')} *</Label>
              <div className="relative">
                <Input
                  id="purchasePrice"
                  type="number"
                  placeholder="0"
                  value={formData.purchasePrice}
                  onChange={(e) => handleChange("purchasePrice", e.target.value)}
                  className="bg-card border-border/50 text-lg font-bold pl-16"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  د.ج
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="transportCost">{t('newProduct.transportCost')}</Label>
                <Input
                  id="transportCost"
                  type="number"
                  placeholder="0"
                  value={formData.transportCost}
                  onChange={(e) => handleChange("transportCost", e.target.value)}
                  className="bg-card border-border/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="extraCosts">{t('newProduct.extraCosts')}</Label>
                <Input
                  id="extraCosts"
                  type="number"
                  placeholder="0"
                  value={formData.extraCosts}
                  onChange={(e) => handleChange("extraCosts", e.target.value)}
                  className="bg-card border-border/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profitMargin">{t('newProduct.profitMargin')}</Label>
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
                <Label htmlFor="salePrice">{t('newProduct.salePrice')} *</Label>
                <span className="text-xs text-accent">{t('newProduct.salePriceEditable')}</span>
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

            {/* Payment Type */}
            <div className="space-y-2">
              <Label>{t('newProduct.paymentType')}</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={formData.paymentType === "cash" ? "primary" : "outline"}
                  className="flex-1"
                  onClick={() => handleChange("paymentType", "cash")}
                >
                  {t('newProduct.paymentCash')}
                </Button>
                <Button
                  type="button"
                  variant={formData.paymentType === "credit" ? "primary" : "outline"}
                  className="flex-1"
                  onClick={() => handleChange("paymentType", "credit")}
                >
                  {t('newProduct.paymentCredit')}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Summary */}
        {quantity > 0 && purchasePrice > 0 && salePrice > 0 && (
          <section className="bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-4 space-y-4 animate-fade-in">
            <h3 className="font-semibold text-foreground">{t('newProduct.profitSummary')}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background/50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground">{t('newProduct.totalCost')}</p>
                <p className="text-lg font-bold">{totalCost.toLocaleString()} {currency}</p>
              </div>
              <div className="bg-background/50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground">{t('newProduct.costPerUnit')}</p>
                <p className="text-lg font-bold">{Math.round(costPerUnit).toLocaleString()} {currency}</p>
              </div>
            </div>
            <div className={cn(
              "border rounded-xl p-4",
              marginPct >= 15 ? "bg-success/10 border-success/30" : "bg-warning/10 border-warning/30",
            )}>
              <p className="text-sm text-muted-foreground">{t('newProduct.profitPerUnit')}</p>
              <p className={cn("text-2xl font-bold", marginPct >= 15 ? "text-success" : "text-warning")}>
                {Math.round(profitPerUnit).toLocaleString()} {currency}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{t('newProduct.marginPct')}: {marginPct}%</p>
            </div>
          </section>
        )}
      </main>

      {/* Save Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border/50 safe-bottom">
        <Button
          variant="gold"
          size="xl"
          className="w-full"
          disabled={!formData.name || !formData.quantity || !formData.purchasePrice || !formData.salePrice || addProduct.isPending}
          onClick={handleSubmit}
        >
          <Save className="h-5 w-5" />
          {addProduct.isPending ? t('newProduct.saving') : t('newProduct.saveProduct')}
        </Button>
      </div>
    </div>
  );
}
