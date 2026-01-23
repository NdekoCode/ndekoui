import { useId } from 'react';

import { Label } from '@/registry/ndeko/ui/label';
import { SelectNative } from '@/registry/ndeko/ui/select-native';

export default function Select08() {
  const id = useId();

  return (
    <div className='group flex w-full max-w-xs flex-col gap-2'>
      <Label htmlFor={id} className='group-has-disabled:opacity-50'>
        Framework
      </Label>
      <SelectNative id={id} disabled>
        <option value='react'>React</option>
        <option value='nextjs'>Next.js</option>
        <option value='astro'>Astro</option>
        <option value='gatsby'>Gatsby</option>
      </SelectNative>
    </div>
  );
}
