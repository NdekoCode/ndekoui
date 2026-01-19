import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';

export default function Input53() {
  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Account ID</FieldLabel>
      <Input
        className='read-only:bg-foreground/[0.04] dark:read-only:bg-foreground/[0.02] read-only:shadow-none'
        defaultValue='acct_8f3k2m9q'
        readOnly
      />
    </Field>
  );
}
