import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';

export default function Input02() {
  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>
        Email
        <span className='text-destructive-ink -ms-1' aria-hidden='true'>
          *
        </span>
      </FieldLabel>
      <Input type='email' placeholder='you@example.com' required />
    </Field>
  );
}
