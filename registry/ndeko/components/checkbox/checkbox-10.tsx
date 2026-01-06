import { useId } from 'react';

import { Checkbox } from '@/registry/ndeko/ui/checkbox';
import { Label } from '@/registry/ndeko/ui/label';

export default function Checkbox10() {
  const id = useId();

  return (
    <div className='flex w-full items-center justify-between gap-2'>
      <Checkbox id={id} className='order-1' />
      <Label htmlFor={id}>Show completed tasks</Label>
    </div>
  );
}
