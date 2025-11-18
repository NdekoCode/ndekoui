'use client';

import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox';

import { CheckIcon, MinusIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';

type CheckboxProps = Omit<CheckboxPrimitive.Root.Props, 'className'> & {
  className?: string;
};

const CHECKED_FILL = [
  'data-checked:bg-primary data-checked:text-primary-foreground data-indeterminate:bg-primary data-indeterminate:text-primary-foreground',
  'data-checked:ring-(--ring-color) data-indeterminate:ring-(--ring-color)',
  'dark:data-checked:bg-primary dark:data-indeterminate:bg-primary dark:data-checked:ring-(--ring-color) dark:data-indeterminate:ring-(--ring-color) dark:focus-visible:ring-ring/25',
  '[--ring-color:color-mix(in_oklab,black_15%,var(--primary))] dark:[--ring-color:color-mix(in_oklab,white_15%,var(--primary))]',
].join(' ');

const MARK_SWAP =
  'transition-[scale,opacity] duration-150 ease-(--ease-out-strong)';

const MARK = [
  'relative flex items-center justify-center',
  MARK_SWAP,
  'data-starting-style:scale-60 data-starting-style:opacity-0 data-ending-style:scale-60 data-ending-style:opacity-0 data-ending-style:duration-100',
].join(' ');

const CHECK_GLYPH = [
  'size-3',
  MARK_SWAP,
  'in-data-indeterminate:scale-60 in-data-indeterminate:opacity-0',
].join(' ');

const MINUS_GLYPH = [
  'absolute size-3 scale-60 opacity-0',
  MARK_SWAP,
  'in-data-indeterminate:scale-100 in-data-indeterminate:opacity-100',
].join(' ');

function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      data-slot='checkbox'
      className={cn(
        'peer bg-card hairline-ring ring-foreground/20 inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-[4px] shadow-[0_1px_2px_rgb(0_0_0/0.05)] transition-[background-color,box-shadow] duration-150 outline-none',
        'focus-visible:ring-ring/25 data-invalid:ring-destructive/50 dark:bg-foreground/[0.04] dark:ring-foreground/25 focus-visible:ring-[3px] data-disabled:cursor-not-allowed data-disabled:opacity-50',
        CHECKED_FILL,
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot='checkbox-indicator'
        className={MARK}
      >
        <CheckIcon strokeWidth={2.5} className={CHECK_GLYPH} />
        <MinusIcon strokeWidth={2.5} className={MINUS_GLYPH} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox, type CheckboxProps };
