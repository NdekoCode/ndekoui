'use client';

import { Label } from 'react-aria-components';

import { ClockIcon } from '@/registry/ndeko/lib/icons';
import { DateInput, TimeField } from '@/registry/ndeko/ui/datefield-rac';
import { LABEL_RECIPE } from '@/registry/ndeko/ui/label';

export default function Input39() {
  return (
    <TimeField className='flex w-full max-w-xs flex-col gap-1.5'>
      <Label className={LABEL_RECIPE}>Meeting time</Label>
      <div className='relative'>
        <DateInput className='pe-8' />
        <span className='text-muted-foreground pointer-events-none absolute inset-y-0 end-0 z-10 flex w-8 items-center justify-center'>
          <ClockIcon className='size-4' />
        </span>
      </div>
    </TimeField>
  );
}
