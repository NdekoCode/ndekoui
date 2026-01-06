import { useId } from 'react';

import { Checkbox } from '@/registry/ndeko/ui/checkbox';
import { Label } from '@/registry/ndeko/ui/label';

export default function Checkbox07() {
  const id = useId();

  return (
    <div className='flex items-center gap-2'>
      <Checkbox id={id} />
      <Label htmlFor={id}>
        <span>
          I agree to the{' '}
          <a
            href='#'
            className='text-primary-ink focus-visible:ring-ring/25 rounded-sm underline underline-offset-2 outline-none focus-visible:ring-[3px]'
          >
            terms of service
          </a>
        </span>
      </Label>
    </div>
  );
}
