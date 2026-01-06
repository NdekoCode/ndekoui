import { useId } from 'react';

import { Label } from '@/registry/ndeko/ui/label';
import { Switch } from '@/registry/ndeko/ui/switch';

const CHOICE_CARD = [
  'relative flex w-full items-start gap-2 rounded-xl bg-card p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)] hairline-ring ring-border transition-[box-shadow] duration-150',
  'has-data-checked:shadow-[0_1px_2px_rgb(0_0_0/0.04),0_6px_16px_-8px_color-mix(in_oklab,var(--primary)_35%,transparent)] has-data-checked:ring-primary/45',
].join(' ');

function SupabaseMark() {
  return (
    <span
      aria-hidden='true'
      className='keycap-3d text-foreground inline-flex size-8 shrink-0 items-center justify-center rounded-lg'
    >
      <svg width={18} height={18} viewBox='6 6 20 20' fill='currentColor'>
        <path
          fillOpacity={0.55}
          d='M17.63 25.52c-.506.637-1.533.287-1.545-.526l-.178-11.903h8.003c1.45 0 2.259 1.674 1.357 2.81l-7.637 9.618Z'
        />
        <path d='M14.375 6.367c.506-.638 1.532-.289 1.544.525l.078 11.903H8.094c-1.45 0-2.258-1.674-1.357-2.81l7.638-9.618Z' />
      </svg>
    </span>
  );
}

export default function Switch17() {
  const id = useId();
  const descriptionId = `${id}-description`;

  return (
    <div className={CHOICE_CARD}>
      <Switch
        id={id}
        aria-describedby={descriptionId}
        className='order-1 after:absolute after:inset-0'
      />
      <div className='flex grow items-center gap-3'>
        <SupabaseMark />
        <div className='grid grow gap-1.5'>
          <Label htmlFor={id}>
            Supabase{' '}
            <span className='text-muted-foreground text-xs leading-[inherit] font-normal'>
              (Connected)
            </span>
          </Label>
          <p id={descriptionId} className='text-muted-foreground text-xs'>
            Copy new sign-ups into the members table.
          </p>
        </div>
      </div>
    </div>
  );
}
