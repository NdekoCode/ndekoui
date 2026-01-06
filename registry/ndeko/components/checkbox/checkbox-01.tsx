import { useId } from 'react';

import { Checkbox } from '@/registry/ndeko/ui/checkbox';
import { Label } from '@/registry/ndeko/ui/label';

export default function Checkbox01() {
  const id = useId();

  return (
    <div className='flex items-center gap-2'>
      <Checkbox id={id} />
      <Label htmlFor={id}>Remember me</Label>
    </div>
  );
}
