import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';

export default function Input12() {
  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Domain</FieldLabel>
      <div className='relative'>
        <Input className='peer pe-11' placeholder='acme' />
        <span className='text-muted-foreground pointer-events-none absolute inset-y-0 end-0 flex items-center pe-2.5 text-[13px] select-none peer-disabled:opacity-50'>
          .com
        </span>
      </div>
    </Field>
  );
}
