import type { InputHTMLAttributes } from 'react';
import { cn } from './cn';

export function Slider({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="range" className={cn('h-2 w-full cursor-pointer accent-current', className)} {...props} />;
}
