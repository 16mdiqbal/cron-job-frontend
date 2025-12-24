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
    {
      className,
      variant = 'default',
      size = 'default',
      loading,
      loadingText,
      loadingMinMs = 0,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const [extendLoading, setExtendLoading] = React.useState(false);
    const startedAtRef = React.useRef<number | null>(null);

    // Track when loading starts
    React.useEffect(() => {
      if (loading) {
        startedAtRef.current = Date.now();
      }
    }, [loading]);

    // Handle minimum display time when loading ends
    React.useEffect(() => {
      if (loading) {
        setExtendLoading(false);
        return;
      }

      const minMs = Math.max(0, Number(loadingMinMs) || 0);
      if (minMs === 0 || !startedAtRef.current) {
        return;
      }

      const elapsed = Date.now() - startedAtRef.current;
      const remaining = minMs - elapsed;

      if (remaining <= 0) {
        startedAtRef.current = null;
        return;
      }

      // Extend loading display
      setExtendLoading(true);
      const t = globalThis.setTimeout(() => {
        setExtendLoading(false);
        startedAtRef.current = null;
      }, remaining);
      return () => globalThis.clearTimeout(t);
    }, [loading, loadingMinMs]);

    // Show loading immediately when prop is true, or extended after it ends
    const isLoading = Boolean(loading || extendLoading);
    const content = isLoading && loadingText ? loadingText : children;
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background',
          'transition-all duration-150 ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          'active:scale-[0.97] active:transition-none',
          {
            'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md':
              variant === 'default',
            'bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-md':
              variant === 'destructive',
            'border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:shadow-sm':
              variant === 'outline',
            'bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-sm':
              variant === 'secondary',
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
