import { Field, FieldDescription, FieldLabel } from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';

export default function Input03() {
  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Email</FieldLabel>
      <Input type='email' placeholder='you@example.com' />
      <FieldDescription>
        We will not share your email with anyone.
      </FieldDescription>
    </Field>
  );
}
