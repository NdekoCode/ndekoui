import { useId } from 'react';

import { Label } from '@/registry/ndeko/ui/label';
import { Switch } from '@/registry/ndeko/ui/switch';

const SQUARE_SWITCH = 'rounded-sm [&_[data-slot=switch-thumb]]:rounded-[4px]';

export default function Switch05() {
  const id = useId();

  return (
    <div className='inline-flex items-center gap-2'>
      <Switch id={id} className={SQUARE_SWITCH} />
      <Label htmlFor={id} className='sr-only'>
        Snap to grid
      </Label>
    </div>
  );
}
