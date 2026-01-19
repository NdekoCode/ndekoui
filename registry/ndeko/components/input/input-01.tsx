import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';

export default function Input01() {
  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Email</FieldLabel>
      <Input type='email' placeholder='you@example.com' />
    </Field>
  );
}
