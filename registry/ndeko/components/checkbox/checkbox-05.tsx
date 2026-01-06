import { useId } from 'react';

import { Checkbox } from '@/registry/ndeko/ui/checkbox';
import { Label } from '@/registry/ndeko/ui/label';

const STRUCK_LABEL = [
  'line-through decoration-transparent peer-data-checked:decoration-current',
  'transition-[text-decoration-color] duration-150 ease-(--ease-out-strong)',
].join(' ');

export default function Checkbox05() {
  const id = useId();

  return (
    <div className='flex items-center gap-2'>
      <Checkbox id={id} defaultChecked />
      <Label htmlFor={id} className={STRUCK_LABEL}>
        Draft the release notes
      </Label>
    </div>
  );
}
