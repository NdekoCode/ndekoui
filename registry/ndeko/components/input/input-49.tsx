'use client';

import { useId } from 'react';
import { usePaymentInputs } from 'react-payment-inputs';

import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';

export default function Input49() {
  const id = useId();
  const { getExpiryDateProps } = usePaymentInputs();

  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Expiry date</FieldLabel>
      <Input
        {...getExpiryDateProps()}
        id={`${id}-expiry`}
        className='tabular-nums [direction:inherit]'
      />
    </Field>
  );
}
