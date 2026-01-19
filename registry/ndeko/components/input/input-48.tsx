'use client';

import { useId } from 'react';
import { usePaymentInputs } from 'react-payment-inputs';

import { CreditCardIcon } from '@/registry/ndeko/lib/icons';
import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';

export default function Input48() {
  const id = useId();
  const { getCardNumberProps } = usePaymentInputs();

  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Card number</FieldLabel>
      <div className='relative'>
        <Input
          {...getCardNumberProps()}
          id={`${id}-number`}
          className='peer ps-8 tabular-nums [direction:inherit]'
        />
        <span className='text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex w-8 items-center justify-center peer-disabled:opacity-50'>
          <CreditCardIcon className='size-4' />
        </span>
      </div>
    </Field>
  );
}
