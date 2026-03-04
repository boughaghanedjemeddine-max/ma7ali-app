import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  /** Large emoji or icon string (emoji preferred for visual impact) */
  icon: string | ReactNode;
  title: string;
  description?: string;
  /** Primary CTA */
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  /** Secondary CTA */
  secondaryAction?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  /** Use 'page' for full-page center, 'section' for inline inside a card/section */
  variant?: 'page' | 'section';
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  variant = 'page',
  className,
}: EmptyStateProps) {
  return (
    <div
      dir="rtl"
      className={cn(
        'flex flex-col items-center justify-center text-center',
        variant === 'page' ? 'py-20 px-6' : 'py-10 px-4',
        className
      )}
    >
      {/* Icon / Emoji ring */}
      <div className="mb-4 relative">
        <div
          className={cn(
            'rounded-2xl flex items-center justify-center shadow-inner',
            variant === 'page'
              ? 'w-24 h-24 text-5xl bg-muted/60'
              : 'w-16 h-16 text-3xl bg-muted/50'
          )}
        >
          {typeof icon === 'string' ? (
            <span role="img" aria-label={title}>{icon}</span>
          ) : (
            icon
          )}
        </div>
        {/* Decorative ring */}
        <div
          className={cn(
            'absolute inset-0 rounded-2xl border-2 border-dashed border-border/40 scale-110 pointer-events-none',
          )}
        />
      </div>

      <h3
        className={cn(
          'font-bold text-foreground',
          variant === 'page' ? 'text-lg' : 'text-sm'
        )}
      >
        {title}
      </h3>

      {description && (
        <p
          className={cn(
            'text-muted-foreground mt-1 max-w-xs leading-relaxed',
            variant === 'page' ? 'text-sm' : 'text-xs'
          )}
        >
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="flex flex-col items-center gap-2 mt-5 w-full max-w-xs">
          {action && (
            action.href ? (
              <Button
                className="w-full bg-gradient-to-r from-primary to-primary/80 shadow-md"
                asChild
              >
                <a href={action.href}>{action.label}</a>
              </Button>
            ) : (
              <Button
                className="w-full bg-gradient-to-r from-primary to-primary/80 shadow-md"
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            )
          )}
          {secondaryAction && (
            secondaryAction.href ? (
              <Button variant="ghost" size="sm" className="w-full text-muted-foreground" asChild>
                <a href={secondaryAction.href}>{secondaryAction.label}</a>
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground"
                onClick={secondaryAction.onClick}
              >
                {secondaryAction.label}
              </Button>
            )
          )}
        </div>
      )}
    </div>
  );
}
