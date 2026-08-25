import type { SelectHTMLAttributes } from 'react';
import { cn } from './cn';

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'h-10 rounded-md border border-border bg-background px-3 text-sm focus-visible:outline-none',
        className,
      )}
      {...props}
    />
  );
}
