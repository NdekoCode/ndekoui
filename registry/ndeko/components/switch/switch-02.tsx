import { useId } from 'react';

import { Label } from '@/registry/ndeko/ui/label';
import { Switch } from '@/registry/ndeko/ui/switch';

const SMALL_SWITCH = [
  'h-4 w-6',
  '[&_[data-slot=switch-thumb]]:size-3',
  '[&_[data-slot=switch-thumb][data-checked]]:translate-x-2',
  'active:[&_[data-slot=switch-thumb]]:w-4',
  'active:[&_[data-slot=switch-thumb][data-checked]]:translate-x-1',
].join(' ');

export default function Switch02() {
  const id = useId();

  return (
    <div className='inline-flex items-center gap-2'>
      <Switch id={id} className={SMALL_SWITCH} />
      <Label htmlFor={id} className='sr-only'>
        Compact mode
      </Label>
    </div>
  );
}
