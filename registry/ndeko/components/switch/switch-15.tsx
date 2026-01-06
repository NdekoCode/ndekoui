import { useId } from 'react';

import { Label } from '@/registry/ndeko/ui/label';
import { Switch } from '@/registry/ndeko/ui/switch';

const CHOICE_CARD = [
  'relative flex w-full items-start gap-2 rounded-xl bg-card p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)] hairline-ring ring-border transition-[box-shadow] duration-150',
  'has-data-checked:shadow-[0_1px_2px_rgb(0_0_0/0.04),0_6px_16px_-8px_color-mix(in_oklab,var(--primary)_35%,transparent)] has-data-checked:ring-primary/45',
].join(' ');

export default function Switch15() {
  const id = useId();
  const descriptionId = `${id}-description`;

  return (
    <div className={CHOICE_CARD}>
      <Switch
        id={id}
        aria-describedby={descriptionId}
        className='order-1 after:absolute after:inset-0'
      />
      <div className='grid grow gap-1.5'>
        <Label htmlFor={id}>
          Two-factor authentication{' '}
          <span className='text-muted-foreground text-xs leading-[inherit] font-normal'>
            (Recommended)
          </span>
        </Label>
        <p id={descriptionId} className='text-muted-foreground text-xs'>
          Ask for a code from your phone at every sign in.
        </p>
      </div>
    </div>
  );
}
