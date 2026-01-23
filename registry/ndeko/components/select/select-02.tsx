import { useId } from 'react';

import { Label } from '@/registry/ndeko/ui/label';
import { SelectNative } from '@/registry/ndeko/ui/select-native';

export default function Select02() {
  const id = useId();

  return (
    <div className='flex w-full max-w-xs flex-col gap-2'>
      <Label htmlFor={id}>Team size</Label>
      <SelectNative id={id} defaultValue=''>
        <option value='' disabled>
          Pick a team size
        </option>
        <option value='small'>1 to 5 people</option>
        <option value='medium'>6 to 10 people</option>
        <option value='large'>More than 10 people</option>
      </SelectNative>
    </div>
  );
}
