'use client';

import { Label } from 'react-aria-components';

import { DateField, DateInput } from '@/registry/ndeko/ui/datefield-rac';
import { LABEL_RECIPE } from '@/registry/ndeko/ui/label';

export default function Input36() {
  return (
    <DateField className='flex w-full max-w-xs flex-col gap-1.5'>
      <Label className={LABEL_RECIPE}>Start date</Label>
      <DateInput />
    </DateField>
  );
}
