import { useId } from 'react';

import { Label } from '@/registry/ndeko/ui/label';
import { SelectNative } from '@/registry/ndeko/ui/select-native';

export default function Select05() {
  const id = useId();

  return (
    <div className='flex w-full max-w-xs flex-col gap-2'>
      <Label htmlFor={id}>Framework</Label>
      <SelectNative
        id={id}
        className='ring-primary/40 focus-visible:border-primary/60 focus-visible:ring-primary/25 dark:ring-primary/45 dark:focus-visible:border-primary/60'
      >
        <option value='react'>React</option>
        <option value='nextjs'>Next.js</option>
        <option value='astro'>Astro</option>
        <option value='gatsby'>Gatsby</option>
      </SelectNative>
    </div>
  );
}
