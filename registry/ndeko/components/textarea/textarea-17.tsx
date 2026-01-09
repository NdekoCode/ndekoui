import { useId } from 'react';

import { Label } from '@/registry/ndeko/ui/label';
import { Textarea } from '@/registry/ndeko/ui/textarea';

export default function Textarea17() {
  const id = useId();

  return (
    <div className='flex w-full max-w-xs flex-col gap-2'>
      <Label htmlFor={id}>Meeting notes</Label>
      <Textarea
        id={id}
        placeholder='Decisions, owners and next steps'
        className='field-sizing-fixed h-24'
      />
    </div>
  );
}
