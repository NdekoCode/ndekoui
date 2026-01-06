import { useId } from 'react';

import { Checkbox } from '@/registry/ndeko/ui/checkbox';
import { Label } from '@/registry/ndeko/ui/label';

export default function Checkbox11() {
  const id = useId();
  const descriptionId = `${id}-description`;

  return (
    <div className='flex items-start gap-2'>
      <Checkbox id={id} aria-describedby={descriptionId} />
      <div className='grid grow gap-1.5'>
        <Label htmlFor={id}>
          Weekly digest{' '}
          <span className='text-muted-foreground text-xs leading-[inherit] font-normal'>
            (Recommended)
          </span>
        </Label>
        <p id={descriptionId} className='text-muted-foreground text-xs'>
          A summary of what moved in your projects, every Monday.
        </p>
      </div>
    </div>
  );
}
