import { useId } from 'react';

import { Label } from '@/registry/ndeko/ui/label';
import { Textarea } from '@/registry/ndeko/ui/textarea';

export default function Textarea13() {
  const id = useId();

  return (
    <div className='group relative w-full max-w-xs'>
      <Label
        htmlFor={id}
        className='bg-card absolute start-1.5 top-0 z-10 -translate-y-1/2 px-1 text-xs group-has-disabled:opacity-50'
      >
        Cover letter
      </Label>
      <Textarea id={id} />
    </div>
  );
}
