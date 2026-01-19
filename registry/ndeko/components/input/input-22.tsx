import { Button } from '@/registry/ndeko/ui/button';
import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';

export default function Input22() {
  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Newsletter</FieldLabel>
      <div className='flex gap-2'>
        <Input className='flex-1' type='email' placeholder='you@example.com' />
        <Button variant='outline' type='submit'>
          Subscribe
        </Button>
      </div>
    </Field>
  );
}
