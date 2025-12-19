import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/services/utils/helpers';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
  /**
   * Keeps the loading state visible for at least this many ms to avoid flicker for fast requests.
   */
  loadingMinMs?: number;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'default', size = 'default', loading, loadingText, loadingMinMs = 0, disabled, children, ...props },
    ref
  ) => {
    const [showLoading, setShowLoading] = React.useState(false);
    const startedAtRef = React.useRef<number | null>(null);

    React.useEffect(() => {
      const minMs = Math.max(0, Number(loadingMinMs) || 0);
      if (loading) {
        startedAtRef.current = Date.now();
        setShowLoading(true);
        return;
      }

      if (!showLoading) return;
      const startedAt = startedAtRef.current || Date.now();
      const elapsed = Date.now() - startedAt;
      const remaining = minMs - elapsed;
      if (remaining <= 0) {
        setShowLoading(false);
        startedAtRef.current = null;
        return;
      }

      const t = window.setTimeout(() => {
        setShowLoading(false);
        startedAtRef.current = null;
      }, remaining);
      return () => window.clearTimeout(t);
    }, [loading, loadingMinMs, showLoading]);

    const isLoading = Boolean(showLoading);
    const content = isLoading && loadingText ? loadingText : children;
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'default',
            'bg-destructive text-destructive-foreground hover:bg-destructive/90':
              variant === 'destructive',
            'border border-input bg-background hover:bg-accent hover:text-accent-foreground':
              variant === 'outline',
            'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
            'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
            'text-primary underline-offset-4 hover:underline': variant === 'link',
          },
          {
            'h-10 px-4 py-2': size === 'default',
            'h-9 rounded-md px-3': size === 'sm',
            'h-11 rounded-md px-8': size === 'lg',
            'h-10 w-10': size === 'icon',
          },
          className
        )}
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        {...props}
      >
        {isLoading && (
          <Loader2
            className={cn('animate-spin', size === 'icon' ? 'h-4 w-4' : 'mr-2 h-4 w-4')}
            aria-hidden="true"
          />
        )}
        {content}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button };
