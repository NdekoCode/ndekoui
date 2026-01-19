import { Input as InputPrimitive } from '@base-ui/react/input';

import { CONTROL_RECIPE } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { Field, FieldLabel } from '@/registry/ndeko/ui/field';

const INSET_FIELD = cn(
  CONTROL_RECIPE,
  'w-full max-w-xs gap-1 py-2',
  'focus-within:border-foreground/30 focus-within:ring-ring/25 dark:focus-within:border-foreground/25 focus-within:ring-[3px]'
);

export default function Input33() {
  return (
    <Field className={INSET_FIELD}>
      <FieldLabel className='px-2.5 text-xs'>Email</FieldLabel>
      <InputPrimitive
        className='placeholder:text-muted-foreground/75 h-5 w-full bg-transparent px-2.5 outline-none'
        type='email'
        placeholder='you@example.com'
      />
    </Field>
  );
}
