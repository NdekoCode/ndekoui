import { MailIcon } from '@/registry/ndeko/lib/icons';
import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';

export default function Input10() {
  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Email</FieldLabel>
      <div className='relative'>
        <Input
          className='peer pe-8'
          type='email'
          placeholder='you@example.com'
        />
        <span className='text-muted-foreground pointer-events-none absolute inset-y-0 end-0 flex w-8 items-center justify-center peer-disabled:opacity-50'>
          <MailIcon className='size-4' />
        </span>
      </div>
    </Field>
  );
}
