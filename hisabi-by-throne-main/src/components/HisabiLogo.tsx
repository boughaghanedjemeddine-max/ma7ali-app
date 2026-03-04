import { cn } from "@/lib/utils";
import { ThroneHeader } from "./ThroneHeader";

interface HisabiLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showArabic?: boolean;
  showThrone?: boolean;
}

const sizeClasses = {
  sm: { main: "text-xl", arabic: "text-base", gap: "gap-0.5" },
  md: { main: "text-3xl", arabic: "text-xl", gap: "gap-1" },
  lg: { main: "text-5xl", arabic: "text-3xl", gap: "gap-2" },
};

export function HisabiLogo({ 
  className, 
  size = "md",
  showArabic = true,
  showThrone = true
}: HisabiLogoProps) {
  return (
    <div className={cn("flex flex-col items-start", sizeClasses[size].gap, className)}>
      {/* THRONE Brand Header */}
      {showThrone && size === "sm" && <ThroneHeader className="mb-1" />}
      
      {/* Ma7ali Logo */}
      <div className="flex items-baseline gap-2">
        <span 
          className={cn(
            "font-display font-extrabold tracking-tight",
            sizeClasses[size].main,
            "metallic-text"
          )}
        >
          Ma7ali
        </span>
        {showArabic && (
          <span 
            className={cn(
              "font-display font-bold gold-text",
              sizeClasses[size].arabic
            )}
            dir="rtl"
          >
            محلي
          </span>
        )}
      </div>
    </div>
  );
}
