import { useId } from 'react';

import { Label } from '@/registry/ndeko/ui/label';
import { Textarea } from '@/registry/ndeko/ui/textarea';

export default function Textarea19() {
  const id = useId();

  return (
    <div className='flex w-full max-w-xs flex-col gap-2'>
      <Label htmlFor={id}>Message</Label>
      <Textarea
        id={id}
        placeholder='Write a message'
        className='max-h-[6lh] min-h-8 py-1.5'
      />
    </div>
  );
}
