import * as React from 'react';
import { cn } from '@/services/utils/helpers';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 100,
  className,
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = React.useRef<HTMLSpanElement>(null);

  const showTooltip = React.useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  }, [delay]);

  const hideTooltip = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  }, []);

  React.useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    wrapper.addEventListener('mouseenter', showTooltip);
    wrapper.addEventListener('mouseleave', hideTooltip);
    wrapper.addEventListener('focusin', showTooltip);
    wrapper.addEventListener('focusout', hideTooltip);

    return () => {
      wrapper.removeEventListener('mouseenter', showTooltip);
      wrapper.removeEventListener('mouseleave', hideTooltip);
      wrapper.removeEventListener('focusin', showTooltip);
      wrapper.removeEventListener('focusout', hideTooltip);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [showTooltip, hideTooltip]);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-900 dark:border-t-gray-100 border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 dark:border-b-gray-100 border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-900 dark:border-l-gray-100 border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-900 dark:border-r-gray-100 border-y-transparent border-l-transparent',
  };

  return (
    <span ref={wrapperRef} className="relative inline-block">
      {children}
      {isVisible && content && (
        <span
          className={cn(
            'absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 rounded shadow-lg whitespace-nowrap pointer-events-none animate-fade-in',
            positionClasses[position],
            className
          )}
          role="tooltip"
        >
          {content}
          <span
            className={cn('absolute w-0 h-0 border-4', arrowClasses[position])}
            aria-hidden="true"
          />
        </span>
      )}
    </span>
  );
};

export default Tooltip;
