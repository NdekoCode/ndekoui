import { Input as InputPrimitive } from '@base-ui/react/input';

import { CONTROL_RECIPE } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import { SelectNative } from '@/registry/ndeko/ui/select-native';

const EXTENSIONS = ['.com', '.org', '.net'];

const GROUP = cn(
  CONTROL_RECIPE,
  'flex h-8 items-stretch overflow-hidden',
  'focus-within:border-foreground/30 focus-within:ring-ring/25 dark:focus-within:border-foreground/25 focus-within:ring-[3px]'
);

const BARE_INPUT =
  'placeholder:text-muted-foreground/75 h-full min-w-0 flex-1 bg-transparent px-2.5 outline-none';

const BARE_SELECT =
  'text-muted-foreground hover:text-foreground h-full w-fit rounded-none border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0 dark:bg-transparent';

const SEPARATOR =
  'bg-foreground/12 dark:bg-foreground/15 w-(--hairline) shrink-0';

export default function Input18() {
  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Domain</FieldLabel>
      <div className={GROUP}>
        <InputPrimitive className={BARE_INPUT} placeholder='acme' />
        <span className={SEPARATOR} aria-hidden='true' />
        <SelectNative className={BARE_SELECT} aria-label='Domain extension'>
          {EXTENSIONS.map((extension) => (
            <option key={extension} value={extension}>
              {extension}
            </option>
          ))}
        </SelectNative>
      </div>
    </Field>
  );
}
