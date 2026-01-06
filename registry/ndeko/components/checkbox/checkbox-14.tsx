import { useId } from 'react';

import { Checkbox } from '@/registry/ndeko/ui/checkbox';
import { Label } from '@/registry/ndeko/ui/label';

const CHOICE_CARD = [
  'relative flex w-full items-start gap-2 rounded-xl bg-card p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)] hairline-ring ring-border transition-[box-shadow] duration-150',
  'has-data-checked:shadow-[0_1px_2px_rgb(0_0_0/0.04),0_6px_16px_-8px_color-mix(in_oklab,var(--primary)_35%,transparent)] has-data-checked:ring-primary/45',
].join(' ');

export default function Checkbox14() {
  const id = useId();
  const descriptionId = `${id}-description`;

  return (
    <div className={CHOICE_CARD}>
      <Checkbox
        id={id}
        aria-describedby={descriptionId}
        className='order-1 after:absolute after:inset-0'
      />
      <div className='grid grow gap-1.5'>
        <Label htmlFor={id}>
          Auto-archive{' '}
          <span className='text-muted-foreground text-xs leading-[inherit] font-normal'>
            (Recommended)
          </span>
        </Label>
        <p id={descriptionId} className='text-muted-foreground text-xs'>
          Moves finished tasks off the board after 14 days.
        </p>
      </div>
    </div>
  );
}
