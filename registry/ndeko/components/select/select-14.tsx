import { useId } from 'react';

import { CONTROL_RECIPE } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { SelectNative } from '@/registry/ndeko/ui/select-native';

const INSET_FIELD = cn(
  CONTROL_RECIPE,
  'flex max-w-xs flex-col pt-2',
  'focus-within:border-foreground/30 focus-within:ring-ring/25 focus-within:ring-[3px]',
  'has-disabled:cursor-not-allowed has-disabled:opacity-50'
);

export default function Select14() {
  const id = useId();

  return (
    <div className={INSET_FIELD}>
      <label htmlFor={id} className='px-2.5 text-xs font-medium'>
        Framework
      </label>
      <SelectNative
        id={id}
        defaultValue=''
        className='h-7 bg-transparent shadow-none ring-0 focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent dark:focus-visible:border-transparent'
      >
        <option value='' disabled>
          Pick a framework
        </option>
        <option value='react'>React</option>
        <option value='nextjs'>Next.js</option>
        <option value='astro'>Astro</option>
        <option value='gatsby'>Gatsby</option>
      </SelectNative>
    </div>
  );
}
