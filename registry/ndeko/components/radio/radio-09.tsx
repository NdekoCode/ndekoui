import { useId } from 'react';

import { Label } from '@/registry/ndeko/ui/label';
import { RadioGroup, RadioGroupItem } from '@/registry/ndeko/ui/radio-group';

const CHOICE_CARD = [
  'relative flex w-full items-start gap-2 rounded-xl bg-card p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)] hairline-ring ring-border transition-[box-shadow] duration-150',
  'has-data-checked:shadow-[0_1px_2px_rgb(0_0_0/0.04),0_6px_16px_-8px_color-mix(in_oklab,var(--primary)_35%,transparent)] has-data-checked:ring-primary/45',
].join(' ');

const MARK_TILE =
  'keycap-3d text-foreground inline-flex h-6 w-8 shrink-0 items-center justify-center rounded-sm';

function MastercardMark() {
  return (
    <span aria-hidden='true' className={MARK_TILE}>
      <svg width={20} height={12.5} viewBox='0 0 24 15' fill='currentColor'>
        <circle cx='7.5' cy='7.5' r='7.5' fillOpacity={0.85} />
        <circle cx='16.5' cy='7.5' r='7.5' fillOpacity={0.45} />
      </svg>
    </span>
  );
}

function VisaMark() {
  return (
    <span aria-hidden='true' className={MARK_TILE}>
      <svg width={24} height={9} viewBox='4 7.5 24 9' fill='currentColor'>
        <path d='m15.884 8.262-1.604 7.496h-1.94l1.604-7.496h1.94Z' />
        <path
          fillRule='evenodd'
          clipRule='evenodd'
          d='M26.207 15.758H28l-1.567-7.496H24.78a.882.882 0 0 0-.826.55l-2.91 6.946h2.037l.404-1.12h2.488l.235 1.12Zm-2.165-2.656 1.021-2.815.587 2.815h-1.608Z'
        />
        <path d='M21.144 13.31c.005-1.183-.975-1.698-1.76-2.11-.526-.276-.964-.506-.957-.861.007-.27.263-.555.823-.628.277-.036 1.044-.065 1.913.335l.34-1.59a5.23 5.23 0 0 0-1.815-.331c-1.917 0-3.265 1.018-3.276 2.477-.013 1.08.963 1.681 1.697 2.04.756.368 1.01.604 1.006.932-.005.503-.604.726-1.16.734-.945.015-1.506-.247-1.95-.454l-.042-.02-.352 1.643c.454.208 1.29.39 2.156.398 2.038 0 3.371-1.006 3.377-2.565ZM13.112 8.262 9.97 15.758H7.92L6.374 9.775c-.094-.368-.175-.503-.46-.658-.467-.253-1.237-.49-1.914-.638l.046-.217h3.3c.42 0 .798.28.894.763l.817 4.338 2.018-5.101h2.037Z' />
      </svg>
    </span>
  );
}

const SAVED_CARDS = [
  {
    value: 'mastercard',
    label: 'Mastercard ending in 8821',
    note: 'Expires 09/28',
    description: 'Used for the last three invoices.',
    Mark: MastercardMark,
  },
  {
    value: 'visa',
    label: 'Visa ending in 4242',
    note: 'Expires 04/29',
    description: 'Added by Amara Okafor in March.',
    Mark: VisaMark,
  },
];

export default function Radio09() {
  const id = useId();

  return (
    <RadioGroup
      defaultValue='mastercard'
      aria-label='Payment card'
      className='w-full gap-2'
    >
      {SAVED_CARDS.map((card) => {
        const itemId = `${id}-${card.value}`;
        const descriptionId = `${itemId}-description`;

        return (
          <div key={card.value} className={CHOICE_CARD}>
            <RadioGroupItem
              value={card.value}
              id={itemId}
              aria-describedby={descriptionId}
              className='order-1 after:absolute after:inset-0'
            />
            <div className='flex grow items-start gap-3'>
              <card.Mark />
              <div className='grid grow gap-1.5'>
                <Label htmlFor={itemId}>
                  {card.label}{' '}
                  <span className='text-muted-foreground text-xs leading-[inherit] font-normal'>
                    ({card.note})
                  </span>
                </Label>
                <p id={descriptionId} className='text-muted-foreground text-xs'>
                  {card.description}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </RadioGroup>
  );
}
