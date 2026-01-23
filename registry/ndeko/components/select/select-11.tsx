import { useId } from 'react';

import { Label } from '@/registry/ndeko/ui/label';
import { SelectNative } from '@/registry/ndeko/ui/select-native';

export default function Select11() {
  const id = useId();

  return (
    <div className='flex w-full max-w-xs flex-col gap-2'>
      <Label htmlFor={id}>Technology</Label>
      <SelectNative id={id}>
        <optgroup label='Frontend'>
          <option value='react'>React</option>
          <option value='vue'>Vue</option>
          <option value='angular'>Angular</option>
        </optgroup>
        <optgroup label='Backend'>
          <option value='nodejs'>Node.js</option>
          <option value='python'>Python</option>
          <option value='java'>Java</option>
        </optgroup>
      </SelectNative>
    </div>
  );
}
