'use client';

import { Radio as RadioPrimitive } from '@base-ui/react/radio';
import { RadioGroup as RadioGroupPrimitive } from '@base-ui/react/radio-group';

import { cn } from '@/registry/ndeko/lib/utils';

type WithClassName<Props> = Omit<Props, 'className'> & { className?: string };

function RadioGroup({
  className,
  ...props
}: WithClassName<RadioGroupPrimitive.Props>) {
  return (
    <RadioGroupPrimitive
      data-slot='radio-group'
      className={cn('grid gap-3', className)}
      {...props}
    />
  );
}

const CHECKED_FILL = [
  'data-checked:bg-primary data-checked:ring-(--ring-color)',
  'dark:data-checked:bg-primary dark:data-checked:ring-(--ring-color) dark:focus-visible:ring-ring/25',
  '[--ring-color:color-mix(in_oklab,black_15%,var(--primary))] dark:[--ring-color:color-mix(in_oklab,white_15%,var(--primary))]',
].join(' ');

function RadioGroupItem({
  className,
  ...props
}: WithClassName<RadioPrimitive.Root.Props>) {
  return (
    <RadioPrimitive.Root
      data-slot='radio-group-item'
      className={cn(
        'peer bg-card hairline-ring ring-foreground/20 inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-full shadow-[0_1px_2px_rgb(0_0_0/0.05)] transition-[background-color,box-shadow] duration-150 outline-none',
        'focus-visible:ring-ring/25 dark:bg-foreground/[0.04] dark:ring-foreground/25 focus-visible:ring-[3px] data-disabled:cursor-not-allowed data-disabled:opacity-50',
        CHECKED_FILL,
        className
      )}
      {...props}
    >
      <RadioPrimitive.Indicator
        data-slot='radio-group-indicator'
        className='size-1.5 rounded-full bg-white transition-[scale,opacity] duration-150 ease-(--ease-out-strong) data-ending-style:scale-60 data-ending-style:opacity-0 data-ending-style:duration-100 data-starting-style:scale-60 data-starting-style:opacity-0'
      />
    </RadioPrimitive.Root>
  );
}

export { RadioGroup, RadioGroupItem };
