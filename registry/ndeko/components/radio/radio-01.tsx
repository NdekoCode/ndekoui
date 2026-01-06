import { useId } from 'react';

import { Label } from '@/registry/ndeko/ui/label';
import { RadioGroup, RadioGroupItem } from '@/registry/ndeko/ui/radio-group';

const VISIBILITY_OPTIONS = [
  { value: 'everyone', label: 'Everyone' },
  { value: 'members', label: 'Members only' },
  { value: 'private', label: 'Only me' },
];

export default function Radio01() {
  const id = useId();

  return (
    <RadioGroup defaultValue='everyone' aria-label='Project visibility'>
      {VISIBILITY_OPTIONS.map((option) => {
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
