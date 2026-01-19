import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';

export default function Input11() {
  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Website</FieldLabel>
      <div className='relative'>
        <Input className='peer ps-15' placeholder='acme.dev' />
        <span className='text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center ps-2.5 text-[13px] select-none peer-disabled:opacity-50'>
          https://
        </span>
      </div>
    </Field>
  );
}
