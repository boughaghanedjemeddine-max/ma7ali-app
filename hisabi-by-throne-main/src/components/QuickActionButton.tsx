import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface QuickActionButtonProps {
  icon: LucideIcon;
  label: string;
  to: string;
  variant?: "default" | "gold" | "primary";
  className?: string;
  delay?: number;
}

const variantStyles = {
  default: {
    wrapper: "border-border/30 hover:border-accent/30",
    icon: "text-muted-foreground group-hover:text-accent",
    bg: "bg-muted/50 group-hover:bg-accent/10",
  },
  gold: {
    wrapper: "border-accent/30 hover:border-accent/50 hover:shadow-gold",
    icon: "text-accent",
    bg: "bg-accent/15 group-hover:bg-accent/25",
  },
  primary: {
    wrapper: "border-primary/30 hover:border-primary/50 hover:shadow-primary",
    icon: "text-primary-glow",
    bg: "bg-primary/15 group-hover:bg-primary/25",
  },
};

export function QuickActionButton({
  icon: Icon,
  label,
  to,
  variant = "default",
  className,
  delay = 0,
}: QuickActionButtonProps) {
  const styles = variantStyles[variant];

  return (
    <Link
      to={to}
      className={cn(
        "group action-card animate-card-enter opacity-0",
        styles.wrapper,
        className
      )}
      style={{ animationDelay: `${delay * 0.06}s`, animationFillMode: "forwards" }}
    >
      <div className={cn(
        "rounded-xl p-3 transition-all duration-300",
        styles.bg
      )}>
        <Icon className={cn("h-5 w-5 transition-colors duration-200", styles.icon)} />
      </div>
      <span className="text-[11px] font-medium text-center text-muted-foreground group-hover:text-foreground transition-colors">
        {label}
      </span>
    </Link>
  );
}
