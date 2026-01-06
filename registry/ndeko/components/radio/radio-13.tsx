import { useId } from 'react';

import { RadioGroup, RadioGroupItem } from '@/registry/ndeko/ui/radio-group';

type CoreOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

const CORE_OPTIONS: CoreOption[] = [
  { value: '2', label: '2 CPU' },
  { value: '4', label: '4 CPU' },
  { value: '6', label: '6 CPU' },
  { value: '8', label: '8 CPU' },
  { value: '12', label: '12 CPU' },
  { value: '16', label: '16 CPU', disabled: true },
];

const CORE_TILE = [
  'relative flex cursor-pointer flex-col items-center rounded-lg bg-card px-2 py-3 text-center shadow-[0_1px_2px_rgb(0_0_0/0.04)] hairline-ring ring-border transition-[box-shadow] duration-150',
  'has-data-checked:shadow-[0_1px_2px_rgb(0_0_0/0.04),0_6px_16px_-8px_color-mix(in_oklab,var(--primary)_35%,transparent)] has-data-checked:ring-primary/45',
  'has-focus-visible:ring-[3px] has-focus-visible:ring-ring/25',
  'has-data-disabled:cursor-not-allowed has-data-disabled:opacity-50',
].join(' ');

export default function Radio13() {
  const captionId = useId();

  return (
    <div className='flex w-full flex-col gap-3'>
      <span
        id={captionId}
        className='text-foreground text-[13px] leading-none font-medium'
      >
        CPU cores
      </span>
      <RadioGroup
        defaultValue='2'
        aria-labelledby={captionId}
        className='grid-cols-3 gap-2'
      >
        {CORE_OPTIONS.map((option) => (
          <label key={option.value} className={CORE_TILE}>
            <RadioGroupItem
              value={option.value}
              disabled={option.disabled}
              className='sr-only'
            />
            <span className='text-foreground text-[13px] leading-none font-medium tabular-nums'>
              {option.label}
            </span>
          </label>
        ))}
      </RadioGroup>
    </div>
  );
}
