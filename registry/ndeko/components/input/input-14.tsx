import { Input as InputPrimitive } from '@base-ui/react/input';

import { CONTROL_RECIPE } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { Field, FieldLabel } from '@/registry/ndeko/ui/field';

const GROUP = cn(
  CONTROL_RECIPE,
  'flex h-8 items-stretch overflow-hidden',
  'focus-within:border-foreground/30 focus-within:ring-ring/25 dark:focus-within:border-foreground/25 focus-within:ring-[3px]'
);

const BARE_INPUT =
  'placeholder:text-muted-foreground/75 h-full min-w-0 flex-1 bg-transparent px-2.5 outline-none';

const SEPARATOR =
  'bg-foreground/12 dark:bg-foreground/15 w-(--hairline) shrink-0';

export default function Input14() {
  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Website</FieldLabel>
      <div className={GROUP}>
        <span className='text-muted-foreground flex items-center px-2.5 select-none'>
          https://
        </span>
        <span className={SEPARATOR} aria-hidden='true' />
        <InputPrimitive className={BARE_INPUT} placeholder='acme.dev' />
      </div>
    </Field>
  );
}
