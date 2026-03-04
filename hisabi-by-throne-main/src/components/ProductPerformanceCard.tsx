import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Star } from "lucide-react";

interface ProductPerformanceCardProps {
  type: "best" | "worst";
  product: {
    name: string;
    category: string;
    soldQuantity: number;
    marginPercent: number;
    totalRevenue?: number;
    salePrice?: number;
  };
  className?: string;
  delay?: number;
}

export function ProductPerformanceCard({
  type,
  product,
  className,
  delay = 0,
}: ProductPerformanceCardProps) {
  const isBest = type === "best";

  return (
    <div
      className={cn(
        "throne-card p-4 animate-card-enter opacity-0",
        isBest 
          ? "border-accent/30 bg-gradient-to-br from-accent/10 via-transparent to-transparent" 
          : "border-destructive/20 bg-gradient-to-br from-destructive/10 via-transparent to-transparent",
        className
      )}
      style={{ animationDelay: `${delay * 0.1}s`, animationFillMode: "forwards" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className={cn(
          "rounded-lg p-1.5",
          isBest ? "bg-accent/20 text-accent" : "bg-destructive/20 text-destructive"
        )}>
          {isBest ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        </div>
        <span className={cn(
          "text-xs font-semibold uppercase tracking-wide",
          isBest ? "text-accent" : "text-destructive"
        )}>
          {isBest ? "الأفضل أداءً" : "يحتاج تحسين"}
        </span>
        {isBest && <Star className="h-3 w-3 text-accent fill-accent" />}
      </div>

      {/* Product Info */}
      <div className="space-y-2">
        <h3 className="font-bold text-foreground text-base truncate">{product.name}</h3>
        <p className="text-[11px] text-muted-foreground">{product.category}</p>
        
        <div className="flex items-center justify-between pt-2 border-t border-border/30">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase">المبيعات</p>
            <p className="text-sm font-bold number-display">{product.soldQuantity}</p>
          </div>
          <div className="text-left">
            <p className="text-[10px] text-muted-foreground uppercase">الهامش</p>
            <p className={cn(
              "text-sm font-bold number-display",
              product.marginPercent >= 20 ? "text-success" : "text-warning"
            )}>
              {Math.round(product.marginPercent)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
