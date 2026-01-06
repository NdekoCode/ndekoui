import { useId } from 'react';

import { Label } from '@/registry/ndeko/ui/label';
import { RadioGroup, RadioGroupItem } from '@/registry/ndeko/ui/radio-group';

const CHOICE_CARD = [
  'relative flex w-full items-start gap-2 rounded-xl bg-card p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)] hairline-ring ring-border transition-[box-shadow] duration-150',
  'has-data-checked:shadow-[0_1px_2px_rgb(0_0_0/0.04),0_6px_16px_-8px_color-mix(in_oklab,var(--primary)_35%,transparent)] has-data-checked:ring-primary/45',
].join(' ');

const MARK_TILE =
  'keycap-3d text-foreground inline-flex size-8 shrink-0 items-center justify-center rounded-lg';

function SupabaseMark() {
  return (
    <span aria-hidden='true' className={MARK_TILE}>
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

function PrismaMark() {
  return (
    <span aria-hidden='true' className={MARK_TILE}>
      <svg width={18} height={18} viewBox='6 6 20 20' fill='currentColor'>
        <path
          fillRule='evenodd'
          clipRule='evenodd'
          d='M8.004 19.728a.996.996 0 0 1-.008-1.054l7.478-12.199a.996.996 0 0 1 1.753.104l6.832 14.82a.996.996 0 0 1-.618 1.37l-10.627 3.189a.996.996 0 0 1-1.128-.42l-3.682-5.81Zm8.333-9.686a.373.373 0 0 1 .709-.074l4.712 10.904a.374.374 0 0 1-.236.506L14.18 23.57a.373.373 0 0 1-.473-.431l2.63-13.097Z'
        />
      </svg>
    </span>
  );
}

const PROVIDERS = [
  {
    value: 'supabase',
    label: 'Supabase',
    note: 'Hosted',
    description: 'Postgres with auth and storage, managed for you.',
    Mark: SupabaseMark,
  },
  {
    value: 'prisma',
    label: 'Prisma',
    note: 'Bring your database',
    description: 'A typed client on top of the database you already run.',
    Mark: PrismaMark,
  },
];

export default function Radio10() {
  const id = useId();

  return (
    <RadioGroup
      defaultValue='supabase'
      aria-label='Database provider'
      className='w-full gap-2'
    >
      {PROVIDERS.map((provider) => {
        const itemId = `${id}-${provider.value}`;
        const descriptionId = `${itemId}-description`;

        return (
          <div key={provider.value} className={CHOICE_CARD}>
            <RadioGroupItem
              value={provider.value}
              id={itemId}
              aria-describedby={descriptionId}
              className='order-1 after:absolute after:inset-0'
            />
            <div className='flex grow items-center gap-3'>
              <provider.Mark />
              <div className='grid grow gap-1.5'>
                <Label htmlFor={itemId}>
                  {provider.label}{' '}
                  <span className='text-muted-foreground text-xs leading-[inherit] font-normal'>
                    ({provider.note})
                  </span>
                </Label>
                <p id={descriptionId} className='text-muted-foreground text-xs'>
                  {provider.description}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </RadioGroup>
  );
}
