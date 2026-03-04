import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface ThroneHeaderProps {
  className?: string;
  showAnimation?: boolean;
}

export function ThroneHeader({ className, showAnimation = true }: ThroneHeaderProps) {
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    // Only animate once per session
    const animated = sessionStorage.getItem("throne-animated");
    if (animated) {
      setHasAnimated(true);
    } else if (showAnimation) {
      sessionStorage.setItem("throne-animated", "true");
    }
  }, [showAnimation]);

  const shouldAnimate = showAnimation && !hasAnimated;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {/* THRONE Wordmark */}
      <div className="relative">
        <h1 
          className={cn(
            "font-display font-extrabold tracking-[0.2em] text-sm",
            "bg-gradient-to-r from-foreground via-accent/80 to-foreground bg-clip-text text-transparent",
            shouldAnimate && "animate-fade-up"
          )}
        >
          THRONE
        </h1>
        
        {/* Animated Gold Underline */}
        <div className="relative mt-1 flex justify-center">
          <div 
            className={cn(
              "h-[2px] w-full rounded-full",
              "bg-gradient-to-r from-transparent via-accent to-transparent",
              shouldAnimate ? "animate-underline-reveal" : "opacity-100"
            )}
          />
          {/* Shimmer overlay */}
          <div 
            className={cn(
              "absolute inset-0 h-[2px] rounded-full animate-shimmer-gold",
              shouldAnimate && "delay-1000"
            )}
          />
        </div>
      </div>
    </div>
  );
}
