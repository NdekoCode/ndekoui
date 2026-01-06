import { useId } from 'react';

import { Checkbox } from '@/registry/ndeko/ui/checkbox';
import { Label } from '@/registry/ndeko/ui/label';

export default function Checkbox04() {
  const id = useId();

  return (
    <div className='flex items-center gap-2'>
      <Checkbox id={id} disabled />
      <Label
        htmlFor={id}
        className='peer-data-disabled:cursor-not-allowed peer-data-disabled:opacity-50'
      >
        Sync with calendar
      </Label>
    </div>
  );
}
