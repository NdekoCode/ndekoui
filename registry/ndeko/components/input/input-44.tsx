import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import { OTPField, OTPFieldInput } from '@/registry/ndeko/ui/otp-field';

const CODE_LENGTH = 4;

const SLOTS = Array.from({ length: CODE_LENGTH }, (_, index) => index);

const JOINED_SLOT =
  'rounded-none first:rounded-s-md last:rounded-e-md focus-visible:z-10';

function slotLabelOf(index: number) {
  if (index === 0) {
    return undefined;
  }
  const position = index + 1;
  return `Character ${position} of ${CODE_LENGTH}`;
}

export default function Input44() {
  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Verification code</FieldLabel>
      <OTPField length={CODE_LENGTH} className='gap-0'>
        {SLOTS.map((index) => (
          <OTPFieldInput
            key={index}
            className={JOINED_SLOT}
            aria-label={slotLabelOf(index)}
          />
        ))}
      </OTPField>
    </Field>
  );
}
