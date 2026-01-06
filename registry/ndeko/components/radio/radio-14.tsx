import { useId } from 'react';

import { Label } from '@/registry/ndeko/ui/label';
import { RadioGroup, RadioGroupItem } from '@/registry/ndeko/ui/radio-group';

const LOCATIONS = [
  { value: 'usa', label: 'USA' },
  { value: 'uk', label: 'UK' },
  { value: 'france', label: 'France' },
];

const LOCATION_CHIP = [
  'relative flex items-center gap-2 rounded-lg bg-card p-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)] hairline-ring ring-border transition-[box-shadow] duration-150',
  'has-data-checked:shadow-[0_1px_2px_rgb(0_0_0/0.04),0_6px_16px_-8px_color-mix(in_oklab,var(--primary)_35%,transparent)] has-data-checked:ring-primary/45',
].join(' ');

export default function Radio14() {
  const id = useId();
  const captionId = `${id}-caption`;

  return (
    <div className='flex flex-col gap-3'>
      <span
        id={captionId}
        className='text-foreground text-[13px] leading-none font-medium'
      >
        Server location
      </span>
      <RadioGroup
        defaultValue='usa'
        aria-labelledby={captionId}
        className='flex flex-wrap gap-2'
      >
        {LOCATIONS.map((location) => {
          const itemId = `${id}-${location.value}`;

          return (
            <div key={location.value} className={LOCATION_CHIP}>
              <RadioGroupItem
                value={location.value}
                id={itemId}
                className='after:absolute after:inset-0'
              />
              <Label htmlFor={itemId}>{location.label}</Label>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
}
