import { useId } from 'react';

import { Label } from '@/registry/ndeko/ui/label';
import { RadioGroup, RadioGroupItem } from '@/registry/ndeko/ui/radio-group';

const DENSITY_OPTIONS = [
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'compact', label: 'Compact' },
  { value: 'spacious', label: 'Spacious' },
];

export default function Radio02() {
  const id = useId();

  return (
    <RadioGroup
      defaultValue='comfortable'
      aria-label='Row density'
      className='[--primary:var(--info)] [--ring:var(--info)]'
    >
      {DENSITY_OPTIONS.map((option) => {
        const itemId = `${id}-${option.value}`;

        return (
          <div key={option.value} className='flex items-center gap-2'>
            <RadioGroupItem value={option.value} id={itemId} />
            <Label htmlFor={itemId}>{option.label}</Label>
          </div>
        );
      })}
    </RadioGroup>
  );
}
