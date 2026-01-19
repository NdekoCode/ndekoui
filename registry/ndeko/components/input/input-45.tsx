import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import {
  OTPField,
  OTPFieldInput,
  OTPFieldSeparator,
} from '@/registry/ndeko/ui/otp-field';

const CODE_LENGTH = 6;
const GROUP_SIZE = 3;

const FIRST_GROUP = Array.from({ length: GROUP_SIZE }, (_, index) => index);
const SECOND_GROUP = FIRST_GROUP.map((index) => index + GROUP_SIZE);

const JOINED_SLOT =
  'rounded-none first:rounded-s-md last:rounded-e-md focus-visible:z-10';

function slotLabelOf(index: number) {
  if (index === 0) {
    return undefined;
  }
  const position = index + 1;
  return `Character ${position} of ${CODE_LENGTH}`;
}

function SlotGroup({ slots }: { slots: number[] }) {
  return (
    <div className='flex'>
      {slots.map((index) => (
        <OTPFieldInput
          key={index}
          className={JOINED_SLOT}
          aria-label={slotLabelOf(index)}
        />
      ))}
    </div>
  );
}

export default function Input45() {
  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Verification code</FieldLabel>
      <OTPField length={CODE_LENGTH} className='gap-3'>
        <SlotGroup slots={FIRST_GROUP} />
        <OTPFieldSeparator />
        <SlotGroup slots={SECOND_GROUP} />
      </OTPField>
    </Field>
  );
}
