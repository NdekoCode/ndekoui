import { useId } from 'react';

import { Label } from '@/registry/ndeko/ui/label';
import { SelectNative } from '@/registry/ndeko/ui/select-native';

export default function Select04() {
  const id = useId();
  const hintId = useId();

  return (
    <div className='flex w-full max-w-xs flex-col gap-2'>
      <Label htmlFor={id}>Framework</Label>
      <SelectNative id={id} aria-describedby={hintId}>
        <option value='react'>React</option>
        <option value='nextjs'>Next.js</option>
        <option value='astro'>Astro</option>
        <option value='gatsby'>Gatsby</option>
      </SelectNative>
      <p id={hintId} className='text-muted-foreground text-xs'>
        We set up the starter project with this framework.
      </p>
    </div>
  );
}
