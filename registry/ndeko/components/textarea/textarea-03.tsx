import { useId } from 'react';

import { Label } from '@/registry/ndeko/ui/label';
import { Textarea } from '@/registry/ndeko/ui/textarea';

export default function Textarea03() {
  const id = useId();
  const hintId = `${id}-hint`;

  return (
    <div className='flex w-full max-w-xs flex-col gap-2'>
      <Label htmlFor={id}>Bug report</Label>
      <Textarea
        id={id}
        placeholder='What did you expect, and what happened instead?'
        aria-describedby={hintId}
      />
      <p id={hintId} className='text-muted-foreground text-xs'>
        Steps to reproduce help us fix it faster.
      </p>
    </div>
  );
}
