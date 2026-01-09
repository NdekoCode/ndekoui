import { useId } from 'react';

import { Label } from '@/registry/ndeko/ui/label';
import { Textarea } from '@/registry/ndeko/ui/textarea';

export default function Textarea02() {
  const id = useId();

  return (
    <div className='flex w-full max-w-xs flex-col gap-2'>
      <Label htmlFor={id} className='gap-1'>
        Message
        <span className='text-destructive-ink' aria-hidden='true'>
          *
        </span>
      </Label>
      <Textarea id={id} placeholder='Tell us what happened' required />
    </div>
  );
}
