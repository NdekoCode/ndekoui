import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import { OTPField, OTPFieldInput } from '@/registry/ndeko/ui/otp-field';

const CODE_LENGTH = 4;

const SLOTS = Array.from({ length: CODE_LENGTH }, (_, index) => index);

function slotLabelOf(index: number) {
  if (index === 0) {
    return undefined;
  }
  const position = index + 1;
  return `Character ${position} of ${CODE_LENGTH}`;
}

export default function Input46() {
  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Verification code</FieldLabel>
      <OTPField length={CODE_LENGTH}>
        {SLOTS.map((index) => (
          <OTPFieldInput key={index} aria-label={slotLabelOf(index)} />
        ))}
      </OTPField>
    </Field>
  );
}
