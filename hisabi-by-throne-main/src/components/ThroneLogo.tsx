import { cn } from "@/lib/utils";

interface ThroneLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
  showTagline?: boolean;
}

const sizeClasses = {
  sm: "text-xl",
  md: "text-3xl",
  lg: "text-5xl",
  xl: "text-7xl",
};

const underlineClasses = {
  sm: "h-0.5 w-12",
  md: "h-0.5 w-20",
  lg: "h-1 w-32",
  xl: "h-1 w-48",
};

export function ThroneLogo({ 
  className, 
  size = "md", 
  animated = true,
  showTagline = false 
}: ThroneLogoProps) {
  return (
    <div className={cn("flex flex-col items-center", className)}>
      {/* Main Logo */}
      <div className="relative">
        <h1 
          className={cn(
            "font-display font-bold tracking-wider",
            sizeClasses[size],
            "bg-gradient-to-r from-foreground via-accent to-foreground bg-clip-text text-transparent",
            animated && "animate-fade-in"
          )}
          style={{
            backgroundSize: "200% auto",
          }}
        >
          THRONE
        </h1>
        
        {/* Animated Underline */}
        <div className="relative mt-1 flex justify-center">
          <div 
            className={cn(
              underlineClasses[size],
              "bg-gradient-to-r from-transparent via-accent to-transparent rounded-full",
              animated && "animate-throne-reveal origin-center"
            )}
            style={{
              animationDelay: "0.5s",
              opacity: animated ? 0 : 1,
              animationFillMode: "forwards",
            }}
          />
          {/* Shimmer effect */}
          {animated && (
            <div 
              className={cn(
                underlineClasses[size],
                "absolute top-0 animate-shimmer rounded-full"
              )}
              style={{
                animationDelay: "1.5s",
              }}
            />
          )}
        </div>
      </div>

      {/* Tagline */}
      {showTagline && (
        <p 
          className={cn(
            "mt-3 text-muted-foreground tracking-widest uppercase",
            size === "sm" && "text-[10px]",
            size === "md" && "text-xs",
            size === "lg" && "text-sm",
            size === "xl" && "text-base",
            animated && "animate-fade-up opacity-0 stagger-3"
          )}
          style={{ animationFillMode: "forwards" }}
        >
          Premium Business Solutions
        </p>
      )}
    </div>
  );
}
