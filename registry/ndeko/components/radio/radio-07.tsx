import { useId } from 'react';

import { RadioGroup, RadioGroupItem } from '@/registry/ndeko/ui/radio-group';

const SWATCHES = [
  { value: 'indigo', label: 'Indigo', color: 'var(--primary)' },
  { value: 'blue', label: 'Blue', color: 'var(--info)' },
  { value: 'green', label: 'Green', color: 'var(--success)' },
  { value: 'amber', label: 'Amber', color: 'var(--warning)' },
  { value: 'red', label: 'Red', color: 'var(--destructive)' },
  { value: 'grey', label: 'Grey', color: 'var(--muted-foreground)' },
];

const SWATCH = [
  'size-6 bg-(--swatch) shadow-none ring-(--swatch-ring) dark:bg-(--swatch) dark:ring-(--swatch-ring) data-checked:bg-(--swatch) data-checked:ring-(--swatch-ring)',
  '[--swatch-ring:color-mix(in_oklab,black_15%,var(--swatch))] dark:[--swatch-ring:color-mix(in_oklab,white_15%,var(--swatch))]',
  '[&_[data-slot=radio-group-indicator]]:size-2',
].join(' ');

export default function Radio07() {
  const captionId = useId();

  return (
    <div className='flex flex-col gap-3'>
      <span
        id={captionId}
        className='text-foreground text-[13px] leading-none font-medium'
      >
        Label colour
      </span>
      <RadioGroup
        defaultValue='indigo'
        aria-labelledby={captionId}
        className='flex gap-1.5'
      >
        {SWATCHES.map((swatch) => {
          const swatchStyle = {
            '--swatch': swatch.color,
          } as React.CSSProperties;

          return (
            <RadioGroupItem
              key={swatch.value}
              value={swatch.value}
              aria-label={swatch.label}
              style={swatchStyle}
              className={SWATCH}
            />
          );
        })}
      </RadioGroup>
    </div>
  );
}
