import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';

export default function Input31() {
  return (
    <Field className='relative w-full max-w-xs'>
      <FieldLabel className='bg-card absolute start-2 top-0 z-10 -translate-y-1/2 px-1 text-xs'>
        Email
      </FieldLabel>
      <Input size='lg' type='email' placeholder='you@example.com' />
    </Field>
  );
}
