import { useId } from 'react';

import { Label } from '@/registry/ndeko/ui/label';
import { SelectNative } from '@/registry/ndeko/ui/select-native';

export default function Select06() {
  const id = useId();
  const errorId = useId();

  return (
    <div className='flex w-full max-w-xs flex-col gap-2'>
      <Label htmlFor={id}>Framework</Label>
      <SelectNative
        id={id}
        defaultValue='gatsby'
        aria-invalid
        aria-describedby={errorId}
      >
        <option value='react'>React</option>
        <option value='nextjs'>Next.js</option>
        <option value='astro'>Astro</option>
        <option value='gatsby'>Gatsby</option>
      </SelectNative>
      <p id={errorId} className='text-destructive-ink text-xs'>
        Gatsby is not available on the free plan. Pick another framework.
      </p>
    </div>
  );
}
