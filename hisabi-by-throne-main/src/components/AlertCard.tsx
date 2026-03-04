import { cn } from "@/lib/utils";
import { AlertTriangle, TrendingDown, Package, XCircle } from "lucide-react";

type AlertType = "low-stock" | "loss" | "expense";

interface AlertCardProps {
  type: AlertType;
  title: string;
  message: string;
  className?: string;
}

const alertConfig = {
  "low-stock": {
    icon: Package,
    bgColor: "bg-warning/10",
    borderColor: "border-warning/30",
    iconBg: "bg-warning/20",
    iconColor: "text-warning",
  },
  loss: {
    icon: TrendingDown,
    bgColor: "bg-destructive/10",
    borderColor: "border-destructive/30",
    iconBg: "bg-destructive/20",
    iconColor: "text-destructive",
  },
  expense: {
    icon: AlertTriangle,
    bgColor: "bg-accent/10",
    borderColor: "border-accent/30",
    iconBg: "bg-accent/20",
    iconColor: "text-accent",
  },
};

export function AlertCard({ type, title, message, className }: AlertCardProps) {
  const config = alertConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border p-3 transition-all duration-200",
        "hover:translate-x-1",
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <div className={cn(
        "rounded-lg p-2 shrink-0",
        config.iconBg, 
        config.iconColor
      )}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{message}</p>
      </div>
    </div>
  );
}
