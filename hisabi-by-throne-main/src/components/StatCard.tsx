import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "gold" | "primary" | "success" | "warning";
  className?: string;
  animate?: boolean;
  delay?: number;
}

const variantStyles = {
  default: {
    card: "border-border/30",
    icon: "bg-muted/80 text-foreground",
    value: "text-foreground",
  },
  gold: {
    card: "border-accent/30 bg-gradient-to-br from-accent/15 via-accent/5 to-transparent",
    icon: "bg-accent/20 text-accent",
    value: "gold-text",
  },
  primary: {
    card: "border-primary/30 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent",
    icon: "bg-primary/20 text-primary-glow",
    value: "metallic-text",
  },
  success: {
    card: "border-success/30 bg-gradient-to-br from-success/15 via-success/5 to-transparent",
    icon: "bg-success/20 text-success",
    value: "text-success",
  },
  warning: {
    card: "border-warning/30 bg-gradient-to-br from-warning/15 via-warning/5 to-transparent",
    icon: "bg-warning/20 text-warning",
    value: "text-warning",
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  className,
  animate = true,
  delay = 0,
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        "throne-card relative overflow-hidden p-4 transition-all duration-300",
        "hover:translate-y-[-2px] hover:shadow-lg active:scale-[0.98]",
        styles.card,
        animate && "animate-card-enter opacity-0",
        className
      )}
      style={animate ? { animationDelay: `${delay * 0.08}s`, animationFillMode: "forwards" } : undefined}
    >
      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-background/20 pointer-events-none" />
      
      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
          <p className={cn(
            "mt-2 text-2xl font-bold tracking-tight number-display",
            styles.value
          )}>
            {typeof value === "number" ? value.toLocaleString("ar-DZ") : value}
          </p>
          {subtitle && (
            <p className="mt-1.5 text-[11px] text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              "mt-2 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg",
              trend.isPositive 
                ? "bg-success/15 text-success" 
                : "bg-destructive/15 text-destructive"
            )}>
              <span>{trend.isPositive ? "↑" : "↓"}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn(
            "rounded-xl p-2.5 backdrop-blur-sm",
            styles.icon
          )}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}
