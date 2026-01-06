import { useId } from 'react';

import { Checkbox } from '@/registry/ndeko/ui/checkbox';
import { Label } from '@/registry/ndeko/ui/label';

const STRUCK_LABEL = [
  'relative transition-colors duration-200 peer-data-checked:text-muted-foreground',
  'after:absolute after:inset-x-0 after:top-1/2 after:h-px after:-translate-y-1/2 after:origin-left after:scale-x-0 after:bg-muted-foreground rtl:after:origin-right',
  'after:transition-[scale] after:duration-200 after:ease-(--ease-standard) peer-data-checked:after:scale-x-100',
].join(' ');

export default function Checkbox06() {
  const id = useId();

  return (
    <div className='flex items-center gap-2 [--primary:var(--success)] [--ring:var(--success)]'>
      <Checkbox id={id} defaultChecked className='rounded-full' />
      <Label htmlFor={id} className={STRUCK_LABEL}>
        Book the venue
      </Label>
    </div>
  );
}
