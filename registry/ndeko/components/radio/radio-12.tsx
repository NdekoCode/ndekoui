import { useId } from 'react';

import {
  AppleBrandIcon,
  CreditCardIcon,
  type Icon,
  PaypalBrandIcon,
} from '@/registry/ndeko/lib/icons';
import { Label } from '@/registry/ndeko/ui/label';
import { RadioGroup, RadioGroupItem } from '@/registry/ndeko/ui/radio-group';

type PaymentMethod = {
  value: string;
  label: string;
  Icon: Icon;
};

const PAYMENT_METHODS: PaymentMethod[] = [
  { value: 'card', label: 'Card', Icon: CreditCardIcon },
  { value: 'paypal', label: 'PayPal', Icon: PaypalBrandIcon },
  { value: 'apple-pay', label: 'Apple Pay', Icon: AppleBrandIcon },
];

const METHOD_TILE = [
  'relative flex cursor-pointer flex-col items-center gap-3 rounded-lg bg-card px-2 py-3 text-center shadow-[0_1px_2px_rgb(0_0_0/0.04)] hairline-ring ring-border transition-[box-shadow] duration-150',
  'has-data-checked:shadow-[0_1px_2px_rgb(0_0_0/0.04),0_6px_16px_-8px_color-mix(in_oklab,var(--primary)_35%,transparent)] has-data-checked:ring-primary/45',
  'has-focus-visible:ring-[3px] has-focus-visible:ring-ring/25',
].join(' ');

export default function Radio12() {
  const id = useId();

  return (
    <RadioGroup
      defaultValue='card'
      aria-label='Payment method'
      className='grid-cols-3 gap-2'
    >
      {PAYMENT_METHODS.map((method) => {
        const itemId = `${id}-${method.value}`;

        return (
          <div key={method.value} className={METHOD_TILE}>
            <RadioGroupItem
              value={method.value}
              id={itemId}
              className='sr-only'
            />
            <method.Icon className='text-muted-foreground size-5' />
            <Label
              htmlFor={itemId}
              className='cursor-pointer text-xs after:absolute after:inset-0'
            >
              {method.label}
            </Label>
          </div>
        );
      })}
    </RadioGroup>
  );
}
