import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';
import { Kbd } from '@/registry/ndeko/ui/kbd';

export default function Input25() {
  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Search</FieldLabel>
      <div className='relative'>
        <Input className='pe-10' type='search' placeholder='Search docs' />
        <span className='pointer-events-none absolute inset-y-0 end-0 flex items-center pe-1.5'>
          <Kbd>⌘K</Kbd>
        </span>
      </div>
    </Field>
  );
}
