import { cn } from "@/lib/utils";
import { Package, TrendingUp, TrendingDown } from "lucide-react";

interface ProductCardProps {
  name: string;
  quantity: number;
  purchasePrice: number;
  salePrice: number;
  category?: string;
  isLowStock?: boolean;
  profitMargin?: number;
  className?: string;
  onClick?: () => void;
}

export function ProductCard({
  name,
  quantity,
  purchasePrice,
  salePrice,
  category,
  isLowStock = false,
  profitMargin,
  className,
  onClick,
}: ProductCardProps) {
  const profit = salePrice - purchasePrice;
  const marginPercent = profitMargin ?? ((profit / purchasePrice) * 100);
  const isProfitable = profit > 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-card p-4",
        "transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]",
        isLowStock ? "border-warning/40" : "border-border/50",
        onClick && "cursor-pointer",
        className
      )}
    >
      {/* Low stock indicator */}
      {isLowStock && (
        <div className="absolute top-0 right-0 bg-warning text-warning-foreground text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
          مخزون منخفض
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn(
          "rounded-xl p-2.5",
          isProfitable ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
        )}>
          <Package className="h-5 w-5" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{name}</h3>
          {category && (
            <p className="text-xs text-muted-foreground mt-0.5">{category}</p>
          )}
          
          <div className="flex items-center gap-4 mt-2">
            <div>
              <p className="text-[10px] text-muted-foreground">الكمية</p>
              <p className={cn(
                "text-sm font-bold",
                isLowStock ? "text-warning" : "text-foreground"
              )}>
                {quantity}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">سعر البيع</p>
              <p className="text-sm font-bold text-foreground">
                {salePrice.toLocaleString("ar-DZ")} د.ج
              </p>
            </div>
          </div>
        </div>

        {/* Profit indicator */}
        <div className={cn(
          "flex flex-col items-center rounded-xl px-2 py-1",
          isProfitable ? "bg-success/10" : "bg-destructive/10"
        )}>
          {isProfitable ? (
            <TrendingUp className="h-4 w-4 text-success" />
          ) : (
            <TrendingDown className="h-4 w-4 text-destructive" />
          )}
          <span className={cn(
            "text-xs font-bold mt-0.5",
            isProfitable ? "text-success" : "text-destructive"
          )}>
            {marginPercent.toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
}
