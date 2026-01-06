import { useId } from 'react';

import { Checkbox } from '@/registry/ndeko/ui/checkbox';
import { Label } from '@/registry/ndeko/ui/label';

const FRAMEWORKS = [
  { value: 'react', label: 'React' },
  { value: 'next', label: 'Next.js' },
  { value: 'astro', label: 'Astro' },
];

export default function Checkbox08() {
  const id = useId();

  return (
    <div role='group' aria-label='Frameworks' className='flex gap-6'>
      {FRAMEWORKS.map((framework) => {
        const itemId = `${id}-${framework.value}`;

        return (
          <div key={framework.value} className='flex items-center gap-2'>
            <Checkbox id={itemId} value={framework.value} />
            <Label htmlFor={itemId}>{framework.label}</Label>
          </div>
        );
      })}
    </div>
  );
}
