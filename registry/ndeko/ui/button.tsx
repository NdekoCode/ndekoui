'use client';

import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';
import { isValidElement } from 'react';

import { cn } from '@/registry/ndeko/lib/utils';

const PRIMARY = [
  'bg-primary text-primary-foreground hover:bg-primary/90',
  'shadow-[0_1px_2px_rgb(0_0_0/0.14),inset_0_1px_0_rgb(255_255_255/0.12)]',
  'hairline-ring ring-(--ring-color) [--ring-color:color-mix(in_oklab,black_18%,var(--primary))]',
  'dark:[--ring-color:color-mix(in_oklab,white_15%,var(--primary))]',
].join(' ');

const DESTRUCTIVE = [
  'bg-destructive text-white hover:bg-destructive/90',
  'shadow-[0_1px_2px_rgb(0_0_0/0.14),inset_0_1px_0_rgb(255_255_255/0.12)]',
  'hairline-ring ring-(--ring-color) [--ring-color:color-mix(in_oklab,black_18%,var(--destructive))]',
  'dark:[--ring-color:color-mix(in_oklab,white_15%,var(--destructive))]',
].join(' ');

const OUTLINE = [
  'bg-card text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.05)] hairline-ring ring-foreground/12',
  'hover:bg-foreground/[0.03] data-popup-open:bg-foreground/[0.04] aria-expanded:bg-foreground/[0.04]',
  'dark:bg-foreground/[0.04] dark:ring-foreground/15 dark:hover:bg-foreground/[0.07] dark:data-popup-open:bg-foreground/[0.08] dark:aria-expanded:bg-foreground/[0.08] dark:focus-visible:ring-ring',
].join(' ');

const GHOST =
  'rounded-md hover:bg-foreground/5 hover:text-foreground data-popup-open:bg-foreground/5 aria-expanded:bg-foreground/5';

const buttonVariants = cva(
  [
    'group/button relative inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium',
    'outline-none transition-[color,background-color,box-shadow,scale] duration-150 ease-(--ease-out-strong)',
    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'active:not-aria-[haspopup]:scale-[0.97]',
    'disabled:pointer-events-none disabled:opacity-50 data-disabled:pointer-events-none data-disabled:opacity-50',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(' '),
  {
    variants: {
      variant: {
        default: PRIMARY,
        destructive: DESTRUCTIVE,
        outline: OUTLINE,
        secondary:
          'bg-foreground/[0.06] text-foreground hover:bg-foreground/[0.09]',
        ghost: GHOST,
        link: 'rounded-md text-primary-ink underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-7 px-2.5 text-xs',
        default: 'h-8 px-3.5 text-[13px]',
        lg: 'h-9 px-4 text-[13px]',
        'icon-sm': 'size-7',
        icon: 'size-8',
        'icon-lg': 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

type ButtonProps = Omit<ButtonPrimitive.Props, 'className'> &
  VariantProps<typeof buttonVariants> & {
    className?: string;
  };

const LINK_ROLE = { role: 'link' } as const;

const NO_ROLE = {};

function rendersLink(render: ButtonPrimitive.Props['render']) {
  if (!isValidElement<{ href?: unknown }>(render)) {
    return false;
  }
  return render.props.href !== undefined;
}

/** Base UI gives every non-native button `role="button"`; a link drawn as a button stays a link for screen readers. */
function defaultRoleOf(render: ButtonPrimitive.Props['render']) {
  if (rendersLink(render)) {
    return LINK_ROLE;
  }
  return NO_ROLE;
}

function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot='button'
      className={cn(buttonVariants({ variant, size }), className)}
      {...defaultRoleOf(props.render)}
      {...props}
    />
  );
}

export { Button, buttonVariants, type ButtonProps };
