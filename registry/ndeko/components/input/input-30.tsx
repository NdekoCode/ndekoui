import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';

export default function Input30() {
  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Attachment</FieldLabel>
      <Input
        type='file'
        className='text-muted-foreground file:border-foreground/12 dark:file:border-foreground/15 cursor-pointer p-0 pe-2.5 file:me-2.5 file:cursor-pointer file:border-e-(length:--hairline) file:px-2.5'
      />
    </Field>
  );
}
