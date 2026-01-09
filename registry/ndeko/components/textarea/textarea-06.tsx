import { useId } from 'react';

import { Label } from '@/registry/ndeko/ui/label';
import { Textarea } from '@/registry/ndeko/ui/textarea';

export default function Textarea06() {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className='flex w-full max-w-xs flex-col gap-2'>
      <Label htmlFor={id}>Feedback</Label>
      <Textarea
        id={id}
        placeholder='Leave a comment'
        defaultValue='Hello!'
        aria-invalid
        aria-describedby={errorId}
      />
      <p id={errorId} className='text-destructive-ink text-xs'>
        Write at least 10 characters so we can act on it.
      </p>
    </div>
  );
}
