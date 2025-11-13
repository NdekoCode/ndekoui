'use client';

import { Input as InputPrimitive } from '@base-ui/react/input';

import {
  CONTROL_RECIPE,
  CONTROL_SIZES,
  type ControlSize,
} from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';

type InputProps = Omit<InputPrimitive.Props, 'className' | 'size'> & {
  className?: string;
  size?: ControlSize;
};

const FILE_INPUT =
  'file:me-2 file:inline-flex file:h-full file:border-0 file:bg-transparent file:text-[13px] file:font-medium file:text-foreground';

const SEARCH_INPUT =
  '[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none';

function Input({ className, size = 'default', ...props }: InputProps) {
  return (
    <InputPrimitive
      data-slot='input'
      className={cn(
        CONTROL_RECIPE,
        CONTROL_SIZES[size],
        FILE_INPUT,
        SEARCH_INPUT,
        className
      )}
      {...props}
    />
  );
}

export { Input, type InputProps };
