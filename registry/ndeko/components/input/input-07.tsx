import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';

export default function Input07() {
  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Email</FieldLabel>
      <Input
        type='email'
        placeholder='you@example.com'
        className='bg-foreground/[0.04] dark:bg-foreground/[0.06] shadow-none ring-transparent dark:ring-transparent'
      />
    </Field>
  );
}
