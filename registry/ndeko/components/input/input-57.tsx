import { Input as InputPrimitive } from '@base-ui/react/input';
import { useId } from 'react';

import { CONTROL_RECIPE } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { Label } from '@/registry/ndeko/ui/label';

const GROUP = cn(
  CONTROL_RECIPE,
  'flex h-8 items-stretch overflow-hidden',
  'focus-within:border-foreground/30 focus-within:ring-ring/25 dark:focus-within:border-foreground/25 focus-within:ring-[3px]'
);

const NUMBER_INPUT =
  'placeholder:text-muted-foreground/75 h-full min-w-0 flex-1 bg-transparent px-2.5 tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

export default function Input57() {
  const labelId = useId();

  return (
    <div
      className='flex w-full max-w-xs flex-col gap-1.5'
      role='group'
      aria-labelledby={labelId}
    >
      <Label id={labelId}>Price range</Label>
      <div className={GROUP}>
        <InputPrimitive
          className={NUMBER_INPUT}
          type='number'
          inputMode='decimal'
          placeholder='From'
          aria-label='Minimum price'
        />
        <span
          className='bg-foreground/12 dark:bg-foreground/15 w-(--hairline) shrink-0'
          aria-hidden='true'
        />
        <InputPrimitive
          className={NUMBER_INPUT}
          type='number'
          inputMode='decimal'
          placeholder='To'
          aria-label='Maximum price'
        />
      </div>
    </div>
  );
}
