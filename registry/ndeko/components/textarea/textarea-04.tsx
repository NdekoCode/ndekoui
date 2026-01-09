import { useId } from 'react';

import { Label } from '@/registry/ndeko/ui/label';
import { Textarea } from '@/registry/ndeko/ui/textarea';

export default function Textarea04() {
  const id = useId();

  return (
    <div className='flex w-full max-w-xs flex-col gap-2'>
      <div className='flex items-center justify-between gap-1'>
        <Label htmlFor={id}>Delivery notes</Label>
        <span className='text-muted-foreground text-xs'>Optional</span>
      </div>
      <Textarea id={id} placeholder='Gate code, floor, where to leave it' />
    </div>
  );
}
