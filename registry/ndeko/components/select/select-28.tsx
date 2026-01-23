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

export default function Select28() {
  return (
    <Field className='relative w-full max-w-xs'>
      <FieldLabel className='bg-card absolute start-1.5 top-0 z-10 -translate-y-1/2 px-1 text-xs'>
        Framework
      </FieldLabel>
      <Select items={FRAMEWORKS}>
        <SelectTrigger>
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
