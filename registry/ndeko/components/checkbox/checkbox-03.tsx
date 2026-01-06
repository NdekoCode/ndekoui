import { useId } from 'react';

import { Checkbox } from '@/registry/ndeko/ui/checkbox';
import { Label } from '@/registry/ndeko/ui/label';

export default function Checkbox03() {
  const id = useId();

  return (
    <div className='flex items-center gap-2 [--primary:var(--success)] [--ring:var(--success)]'>
      <Checkbox id={id} defaultChecked />
      <Label htmlFor={id}>Mark invoice as paid</Label>
    </div>
  );
}
