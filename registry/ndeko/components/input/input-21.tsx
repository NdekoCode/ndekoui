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

const SEGMENT_BUTTON =
  'text-foreground hover:bg-foreground/[0.03] focus-visible:bg-foreground/5 flex shrink-0 cursor-pointer items-center px-3 font-medium whitespace-nowrap outline-none transition-colors disabled:pointer-events-none disabled:opacity-50';

const SEPARATOR =
  'bg-foreground/12 dark:bg-foreground/15 w-(--hairline) shrink-0';

export default function Input21() {
  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Invite a teammate</FieldLabel>
      <div className={GROUP}>
        <InputPrimitive
          className={BARE_INPUT}
          type='email'
          placeholder='grace@example.com'
        />
        <span className={SEPARATOR} aria-hidden='true' />
        <button type='submit' className={SEGMENT_BUTTON}>
          Send invite
        </button>
      </div>
    </Field>
  );
}
