import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/ndeko/ui/select';

const FRAMEWORKS = [
  { value: 'react', label: 'React', disabled: true },
  { value: 'nextjs', label: 'Next.js', disabled: false },
  { value: 'astro', label: 'Astro', disabled: true },
  { value: 'gatsby', label: 'Gatsby', disabled: false },
];

export default function Select27() {
  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Framework</FieldLabel>
      <Select items={FRAMEWORKS} defaultValue='nextjs'>
        <SelectTrigger>
          <SelectValue placeholder='Pick a framework' />
        </SelectTrigger>
        <SelectContent>
          {FRAMEWORKS.map((framework) => (
            <SelectItem
              key={framework.value}
              value={framework.value}
              disabled={framework.disabled}
            >
              {framework.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
