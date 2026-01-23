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

export default function Select21() {
  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Framework</FieldLabel>
      <Select items={FRAMEWORKS} defaultValue='nextjs'>
        <SelectTrigger className='bg-foreground/[0.05] dark:bg-foreground/[0.07] shadow-none ring-transparent dark:ring-transparent'>
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
