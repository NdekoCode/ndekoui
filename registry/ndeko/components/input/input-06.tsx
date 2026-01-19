import { Field, FieldError, FieldLabel } from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';

export default function Input06() {
  return (
    <Field className='w-full max-w-xs' invalid>
      <FieldLabel>Email</FieldLabel>
      <Input type='email' defaultValue='ada@lovelace' />
      <FieldError match>
        This address has no domain ending. Try ada@lovelace.dev.
      </FieldError>
    </Field>
  );
}
