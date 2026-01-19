'use client';

import { Label } from 'react-aria-components';

import { DateField, DateInput } from '@/registry/ndeko/ui/datefield-rac';
import { LABEL_RECIPE } from '@/registry/ndeko/ui/label';

export default function Input40() {
  return (
    <DateField
      className='flex w-full max-w-xs flex-col gap-1.5'
      granularity='minute'
      hourCycle={24}
    >
      <Label className={LABEL_RECIPE}>Publish at</Label>
      <DateInput />
    </DateField>
  );
}
