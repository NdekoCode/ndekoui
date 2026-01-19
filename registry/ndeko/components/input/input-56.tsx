'use client';

import { useMaskInput } from 'use-mask-input';

import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';

const TIMESTAMP_MASK = '99:99:99';
const TIMESTAMP_MASK_OPTIONS = { placeholder: '-', showMaskOnHover: false };

export default function Input56() {
  const timestampRef = useMaskInput({
    mask: TIMESTAMP_MASK,
    options: TIMESTAMP_MASK_OPTIONS,
  });

  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Timestamp</FieldLabel>
      <Input
        ref={timestampRef}
        className='tabular-nums'
        placeholder='00:00:00'
      />
    </Field>
  );
}
