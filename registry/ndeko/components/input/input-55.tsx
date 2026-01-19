'use client';

import { useMaskInput } from 'use-mask-input';

import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';

const PLATE_MASK = 'AA99 AAA';
const PLATE_MASK_OPTIONS = { placeholder: '', showMaskOnHover: false };

export default function Input55() {
  const plateRef = useMaskInput({
    mask: PLATE_MASK,
    options: PLATE_MASK_OPTIONS,
  });

  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>License plate</FieldLabel>
      <Input ref={plateRef} placeholder='AB12 CDE' />
    </Field>
  );
}
