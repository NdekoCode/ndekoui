import { useId } from 'react';

import { Checkbox } from '@/registry/ndeko/ui/checkbox';
import { Label } from '@/registry/ndeko/ui/label';

export default function Checkbox13() {
  const id = useId();
  const descriptionId = `${id}-description`;

  return (
    <div className='flex w-full items-start gap-2'>
      <Checkbox id={id} aria-describedby={descriptionId} className='order-1' />
      <div className='grid grow gap-1.5'>
        <Label htmlFor={id}>
          Share usage data{' '}
          <span className='text-muted-foreground text-xs leading-[inherit] font-normal'>
            (Optional)
          </span>
        </Label>
        <p id={descriptionId} className='text-muted-foreground text-xs'>
          Helps us find slow screens. Project content is never sent.
        </p>
      </div>
    </div>
  );
}
