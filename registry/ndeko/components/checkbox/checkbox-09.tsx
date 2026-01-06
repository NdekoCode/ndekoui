import { useId } from 'react';

import { Checkbox } from '@/registry/ndeko/ui/checkbox';
import { Label } from '@/registry/ndeko/ui/label';

const EVENTS = [
  { value: 'comments', label: 'Comments' },
  { value: 'mentions', label: 'Mentions' },
  { value: 'status', label: 'Status changes' },
];

export default function Checkbox09() {
  const id = useId();

  return (
    <div role='group' aria-label='Notify me about' className='grid gap-3'>
      {EVENTS.map((event) => {
        const itemId = `${id}-${event.value}`;

        return (
          <div key={event.value} className='flex items-center gap-2'>
            <Checkbox id={itemId} value={event.value} />
            <Label htmlFor={itemId}>{event.label}</Label>
          </div>
        );
      })}
    </div>
  );
}
