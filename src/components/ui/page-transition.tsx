import * as React from 'react';
import { cn } from '@/services/utils/helpers';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * PageTransition - Adds a subtle fade-in and slide-up animation to page content.
 * Wrap your page content with this component for a polished page load experience.
 */
export const PageTransition: React.FC<PageTransitionProps> = ({ children, className }) => {
  return (
    <div
      className={cn(
        'animate-page-in',
        className
      )}
    >
      {children}
    </div>
  );
};

PageTransition.displayName = 'PageTransition';
