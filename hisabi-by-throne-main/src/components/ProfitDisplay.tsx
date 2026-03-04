import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useEffect, useState } from "react";

interface ProfitDisplayProps {
  value: number;
  label?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showTrend?: boolean;
  previousValue?: number;
  className?: string;
}

const sizeClasses = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-3xl",
  xl: "text-4xl",
};

export function ProfitDisplay({
  value,
  label = "الربح الصافي",
  size = "lg",
  showTrend = false,
  previousValue,
  className,
}: ProfitDisplayProps) {
  const [displayValue, setDisplayValue] = useState(0);
  
  // Animate number counting
  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const stepValue = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += stepValue;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.round(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value]);

  const trend = previousValue !== undefined ? value - previousValue : 0;
  const trendPercent = previousValue ? Math.round((trend / previousValue) * 100) : 0;

  return (
    <div className={cn("text-center", className)}>
      {/* Label */}
      <p className="text-muted-foreground text-sm font-medium mb-2">{label}</p>
      
      {/* Profit Value with Gold Accent */}
      <div className="relative inline-block">
        <span className={cn(
          "profit-number font-extrabold tracking-tight",
          sizeClasses[size]
        )}>
          {Math.round(displayValue).toLocaleString()}
        </span>
        <span className="text-accent text-lg font-bold mr-2"> د.ج</span>
        
        {/* Glow effect behind */}
        <div className="absolute inset-0 blur-2xl bg-accent/20 -z-10 animate-pulse-gold" />
      </div>
      
      {/* Trend indicator */}
      {showTrend && previousValue !== undefined && (
        <div className={cn(
          "mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold",
          trend > 0 && "bg-success/15 text-success",
          trend < 0 && "bg-destructive/15 text-destructive",
          trend === 0 && "bg-muted text-muted-foreground"
        )}>
          {trend > 0 && <TrendingUp className="h-3 w-3" />}
          {trend < 0 && <TrendingDown className="h-3 w-3" />}
          {trend === 0 && <Minus className="h-3 w-3" />}
          <span>
            {trend > 0 ? "+" : ""}{trendPercent}% من الأمس
          </span>
        </div>
      )}
    </div>
  );
}
