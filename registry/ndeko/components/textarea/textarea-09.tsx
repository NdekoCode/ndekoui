import { useId } from 'react';

import { Label } from '@/registry/ndeko/ui/label';
import { Textarea } from '@/registry/ndeko/ui/textarea';

export default function Textarea09() {
  const id = useId();

  return (
    <div className='group flex w-full max-w-xs flex-col gap-2'>
      <Label htmlFor={id} className='group-has-disabled:opacity-50'>
        Comment
      </Label>
      <Textarea id={id} disabled placeholder='Comments are closed' />
    </div>
  );
}
