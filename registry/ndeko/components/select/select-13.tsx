import { useId } from 'react';

import { Label } from '@/registry/ndeko/ui/label';
import { SelectNative } from '@/registry/ndeko/ui/select-native';

export default function Select13() {
  const id = useId();

  return (
    <div className='group relative w-full max-w-xs'>
      <Label
        htmlFor={id}
        className='bg-card absolute start-1.5 top-0 z-10 -translate-y-1/2 px-1 text-xs group-has-disabled:opacity-50'
      >
        Framework
      </Label>
      <SelectNative id={id} defaultValue=''>
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
