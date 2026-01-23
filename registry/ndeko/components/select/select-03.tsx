import { useId } from 'react';

import { ClockIcon } from '@/registry/ndeko/lib/icons';
import { Label } from '@/registry/ndeko/ui/label';
import { SelectNative } from '@/registry/ndeko/ui/select-native';

export default function Select03() {
  const id = useId();

  return (
    <div className='flex w-full max-w-xs flex-col gap-2'>
      <Label htmlFor={id}>Shift</Label>
      <div className='group relative'>
        <SelectNative id={id} className='ps-8'>
          <option value='morning'>6:00 AM to 2:00 PM</option>
          <option value='afternoon'>2:00 PM to 10:00 PM</option>
          <option value='night'>10:00 PM to 6:00 AM</option>
        </SelectNative>
        <span className='text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center ps-2.5 group-has-disabled:opacity-50'>
          <ClockIcon className='size-4' />
        </span>
      </div>
    </div>
  );
}
