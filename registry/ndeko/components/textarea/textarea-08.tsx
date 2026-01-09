import { useId } from 'react';

import { Label } from '@/registry/ndeko/ui/label';
import { Textarea } from '@/registry/ndeko/ui/textarea';

export default function Textarea08() {
  const id = useId();

  return (
    <div className='flex w-full max-w-xs flex-col gap-2'>
      <Label htmlFor={id}>Reply</Label>
      <Textarea
        id={id}
        placeholder='Write a short reply'
        className='min-h-12'
        rows={2}
      />
    </div>
  );
}
