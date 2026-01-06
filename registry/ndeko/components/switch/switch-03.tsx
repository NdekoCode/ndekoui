import { useId } from 'react';

import { Label } from '@/registry/ndeko/ui/label';
import { Switch } from '@/registry/ndeko/ui/switch';

export default function Switch03() {
  const id = useId();

  return (
    <div className='inline-flex items-center gap-2 [--primary:var(--success)] [--ring:var(--success)]'>
      <Switch id={id} defaultChecked />
      <Label htmlFor={id} className='sr-only'>
        Accept new orders
      </Label>
    </div>
  );
}
