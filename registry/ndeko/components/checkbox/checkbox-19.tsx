import { useId } from 'react';

import { Checkbox } from '@/registry/ndeko/ui/checkbox';

type Day = {
  value: string;
  label: string;
  defaultChecked?: boolean;
  disabled?: boolean;
};

const DAYS: Day[] = [
  { value: 'monday', label: 'Monday', defaultChecked: true },
  { value: 'tuesday', label: 'Tuesday', defaultChecked: true },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday', defaultChecked: true },
  { value: 'friday', label: 'Friday', defaultChecked: true },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday', disabled: true },
];

const DAY_CHIP = [
  'relative flex size-8 cursor-pointer items-center justify-center rounded-full bg-card text-[13px] font-medium text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.05)] hairline-ring ring-foreground/15',
  'transition-[background-color,color,box-shadow] duration-150',
  'has-data-checked:bg-primary has-data-checked:text-primary-foreground has-data-checked:ring-(--ring-color)',
  '[--ring-color:color-mix(in_oklab,black_15%,var(--primary))] dark:[--ring-color:color-mix(in_oklab,white_15%,var(--primary))]',
  'has-focus-visible:ring-[3px] has-focus-visible:ring-ring/25',
  'has-data-disabled:cursor-not-allowed has-data-disabled:opacity-50',
].join(' ');

export default function Checkbox19() {
  const id = useId();

  return (
    <fieldset className='space-y-3'>
      <legend className='text-foreground text-[13px] leading-none font-medium'>
        Days of the week
      </legend>
      <div className='flex gap-1.5'>
        {DAYS.map((day) => {
          const itemId = `${id}-${day.value}`;
          const initial = day.label.charAt(0);

          return (
            <label key={day.value} className={DAY_CHIP}>
              <Checkbox
                id={itemId}
                value={day.value}
                defaultChecked={day.defaultChecked}
                disabled={day.disabled}
                className='sr-only'
              />
              <span aria-hidden='true'>{initial}</span>
              <span className='sr-only'>{day.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
