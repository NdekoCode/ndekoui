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

export default function Select19() {
  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Framework</FieldLabel>
      <Select items={FRAMEWORKS} defaultValue='react'>
        <SelectTrigger className='ring-primary/40 focus-visible:border-primary/60 focus-visible:ring-primary/25 data-popup-open:border-primary/60 dark:ring-primary/45 dark:focus-visible:border-primary/60'>
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
