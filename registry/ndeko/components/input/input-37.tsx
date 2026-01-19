'use client';

import { Label } from 'react-aria-components';

import { DateInput, TimeField } from '@/registry/ndeko/ui/datefield-rac';
import { LABEL_RECIPE } from '@/registry/ndeko/ui/label';

export default function Input37() {
  return (
    <TimeField className='flex w-full max-w-xs flex-col gap-1.5'>
      <Label className={LABEL_RECIPE}>Meeting time</Label>
      <DateInput />
    </TimeField>
  );
}
