'use client';

import { Toggle as TogglePrimitive } from '@base-ui/react/toggle';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/registry/ndeko/lib/utils';

const toggleVariants = cva(
  [
    'inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap rounded-md text-[13px] font-medium text-muted-foreground outline-none',
    'transition-[color,background-color,box-shadow,scale] duration-150 ease-(--ease-out-strong) hover:bg-foreground/5 hover:text-foreground',
    'active:not-aria-[haspopup]:scale-[0.97]',
    'data-pressed:bg-foreground/[0.07] data-pressed:text-foreground',
    'focus-visible:ring-[3px] focus-visible:ring-ring/25 data-disabled:pointer-events-none data-disabled:opacity-50',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(' '),
  {
    variants: {
      variant: {
        default: '',
        outline:
          'bg-card shadow-[0_1px_2px_rgb(0_0_0/0.05)] hairline-ring ring-foreground/12 data-pressed:bg-foreground/[0.05] dark:bg-foreground/[0.04] dark:data-pressed:bg-foreground/[0.09] dark:ring-foreground/15',
      },
      size: {
        sm: 'h-7 min-w-7 px-2',
        default: 'h-8 min-w-8 px-2.5',
        lg: 'h-9 min-w-9 px-3',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

type ToggleProps = Omit<TogglePrimitive.Props, 'className'> &
  VariantProps<typeof toggleVariants> & {
    className?: string;
  };

function Toggle({ className, variant, size, ...props }: ToggleProps) {
  return (
    <TogglePrimitive
      data-slot='toggle'
      className={cn(toggleVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Toggle, toggleVariants, type ToggleProps };
