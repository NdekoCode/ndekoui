import { CONTROL_RECIPE } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/ndeko/ui/select';

const FRAMEWORKS = [
  { value: 'react', label: 'React' },
  { value: 'nextjs', label: 'Next.js' },
  { value: 'astro', label: 'Astro' },
  { value: 'gatsby', label: 'Gatsby' },
];

const INSET_FIELD = cn(
  CONTROL_RECIPE,
  'max-w-xs gap-0 pt-2',
  'has-focus-visible:border-foreground/30 has-focus-visible:ring-ring/25 has-focus-visible:ring-[3px]',
  'has-data-popup-open:border-foreground/30',
  'has-data-disabled:cursor-not-allowed has-data-disabled:opacity-50'
);

const BARE_TRIGGER =
  'h-7 bg-transparent shadow-none ring-0 focus-visible:border-transparent focus-visible:ring-0 data-popup-open:border-transparent dark:bg-transparent dark:focus-visible:border-transparent';

export default function Select29() {
  return (
    <Field className={INSET_FIELD}>
      <FieldLabel className='px-2.5 text-xs'>Framework</FieldLabel>
      <Select items={FRAMEWORKS}>
        <SelectTrigger className={BARE_TRIGGER}>
          <SelectValue placeholder='Pick a framework' />
        </SelectTrigger>
        <SelectContent>
          {FRAMEWORKS.map((framework) => (
            <SelectItem key={framework.value} value={framework.value}>
              {framework.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
