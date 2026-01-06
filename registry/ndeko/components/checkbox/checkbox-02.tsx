'use client';

import { useId, useState } from 'react';

import { Checkbox } from '@/registry/ndeko/ui/checkbox';
import { Label } from '@/registry/ndeko/ui/label';

export default function Checkbox02() {
  const id = useId();
  const [isChecked, setIsChecked] = useState(false);
  const [isIndeterminate, setIsIndeterminate] = useState(true);

  function changeChecked(nextChecked: boolean) {
    setIsIndeterminate(false);
    setIsChecked(nextChecked);
  }

  return (
    <div className='flex items-center gap-2'>
      <Checkbox
        id={id}
        checked={isChecked}
        indeterminate={isIndeterminate}
        onCheckedChange={changeChecked}
      />
      <Label htmlFor={id}>Select all tasks</Label>
    </div>
  );
}
