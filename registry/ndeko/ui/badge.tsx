'use client';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/registry/ndeko/lib/utils';

const badgeVariants = cva(
  "inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-md px-1.5 text-xs font-medium [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-3",
  {
    variants: {
      variant: {
        default: 'bg-primary/10 text-primary-ink',
        secondary: 'bg-foreground/[0.06] text-foreground',
        outline: 'bg-card text-foreground hairline-ring ring-border',
        success: 'bg-success/10 text-success-foreground',
        warning: 'bg-warning/10 text-warning-foreground',
        info: 'bg-info/10 text-info-foreground',
        destructive: 'bg-destructive/10 text-destructive-ink',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

type BadgeProps = useRender.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants>;

function Badge({ className, variant, render, ...props }: BadgeProps) {
  const defaultProps = {
    'data-slot': 'badge',
    className: cn(badgeVariants({ variant }), className),
  };

  return useRender({
    defaultTagName: 'span',
    render,
    props: mergeProps<'span'>(defaultProps, props),
  });
}

export { Badge, badgeVariants, type BadgeProps };
