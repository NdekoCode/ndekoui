import { AtSignIcon } from '@/registry/ndeko/lib/icons';
import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';

export default function Input09() {
  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Username</FieldLabel>
      <div className='relative'>
        <Input className='peer ps-8' placeholder='ada.lovelace' />
        <span className='text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex w-8 items-center justify-center peer-disabled:opacity-50'>
          <AtSignIcon className='size-4' />
        </span>
      </div>
    </Field>
  );
}
