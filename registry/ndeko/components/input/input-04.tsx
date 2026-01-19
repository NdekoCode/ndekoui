import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';

export default function Input04() {
  return (
    <Field className='w-full max-w-xs'>
      <div className='flex items-center justify-between gap-2'>
        <FieldLabel>Backup email</FieldLabel>
        <span className='text-muted-foreground text-xs'>Optional</span>
      </div>
      <Input type='email' placeholder='you@example.com' />
    </Field>
  );
}
