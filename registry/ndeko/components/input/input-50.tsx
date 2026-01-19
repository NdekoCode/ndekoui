'use client';

import { useId } from 'react';
import { usePaymentInputs } from 'react-payment-inputs';

import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';

export default function Input50() {
  const id = useId();
  const { getCVCProps } = usePaymentInputs();

  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Security code</FieldLabel>
      <Input
        {...getCVCProps()}
        id={`${id}-cvc`}
        className='tabular-nums [direction:inherit]'
      />
    </Field>
  );
}
