import { useId } from 'react';

import { Checkbox } from '@/registry/ndeko/ui/checkbox';
import { Label } from '@/registry/ndeko/ui/label';

const CHOICE_CARD = [
  'relative flex w-full items-start gap-2 rounded-xl bg-card p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)] hairline-ring ring-border transition-[box-shadow] duration-150',
  'has-data-checked:shadow-[0_1px_2px_rgb(0_0_0/0.04),0_6px_16px_-8px_color-mix(in_oklab,var(--primary)_35%,transparent)] has-data-checked:ring-primary/45',
].join(' ');

function MastercardMark() {
  return (
    <span
      aria-hidden='true'
      className='keycap-3d text-foreground inline-flex h-6 w-8 shrink-0 items-center justify-center rounded-sm'
    >
      <svg width={20} height={12.5} viewBox='0 0 24 15' fill='currentColor'>
        <circle cx='7.5' cy='7.5' r='7.5' fillOpacity={0.85} />
        <circle cx='16.5' cy='7.5' r='7.5' fillOpacity={0.45} />
      </svg>
    </span>
  );
}

export default function Checkbox15() {
  const id = useId();
  const descriptionId = `${id}-description`;

  return (
    <div className={CHOICE_CARD}>
      <Checkbox
        id={id}
        aria-describedby={descriptionId}
        className='order-1 after:absolute after:inset-0'
      />
      <div className='flex grow items-start gap-3'>
        <MastercardMark />
        <div className='grid gap-1.5'>
          <Label htmlFor={id}>
            Mastercard ending in 8821{' '}
            <span className='text-muted-foreground text-xs leading-[inherit] font-normal'>
              (Expires 09/28)
            </span>
          </Label>
          <p id={descriptionId} className='text-muted-foreground text-xs'>
            Save this card for your next orders.
          </p>
        </div>
      </div>
    </div>
  );
}
