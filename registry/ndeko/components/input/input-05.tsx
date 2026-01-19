import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';

export default function Input05() {
  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Email</FieldLabel>
      <Input
        type='email'
        placeholder='you@example.com'
        className='focus-visible:border-primary/60 focus-visible:ring-primary/25 dark:focus-visible:border-primary/60 dark:focus-visible:ring-primary/30'
      />
    </Field>
  );
}
