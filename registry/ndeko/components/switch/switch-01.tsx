import { useId } from 'react';

import { Label } from '@/registry/ndeko/ui/label';
import { Switch } from '@/registry/ndeko/ui/switch';

export default function Switch01() {
  const id = useId();

  return (
    <div className='inline-flex items-center gap-2'>
      <Switch id={id} />
      <Label htmlFor={id} className='sr-only'>
        Enable notifications
      </Label>
    </div>
  );
}
