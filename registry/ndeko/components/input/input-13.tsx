import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';

export default function Input13() {
  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Price</FieldLabel>
      <div className='relative'>
        <Input
          className='peer ps-6 pe-11 tabular-nums'
          placeholder='0.00'
          inputMode='decimal'
        />
        <span className='text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center ps-2.5 text-[13px] select-none peer-disabled:opacity-50'>
          €
        </span>
        <span className='text-muted-foreground pointer-events-none absolute inset-y-0 end-0 flex items-center pe-2.5 text-[13px] select-none peer-disabled:opacity-50'>
          EUR
        </span>
      </div>
    </Field>
  );
}
