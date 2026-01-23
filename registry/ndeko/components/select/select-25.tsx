import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/registry/ndeko/ui/select';

const GROUPS = [
  {
    label: 'Frontend',
    items: [
      { value: 'react', label: 'React' },
      { value: 'vue', label: 'Vue' },
      { value: 'angular', label: 'Angular' },
    ],
  },
  {
    label: 'Backend',
    items: [
      { value: 'nodejs', label: 'Node.js' },
      { value: 'python', label: 'Python' },
      { value: 'java', label: 'Java' },
    ],
  },
];

export default function Select25() {
  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Technology</FieldLabel>
      <Select items={GROUPS} defaultValue='react'>
        <SelectTrigger>
          <SelectValue placeholder='Pick a technology' />
        </SelectTrigger>
        <SelectContent>
          {GROUPS.map((group) => (
            <SelectGroup key={group.label}>
              <SelectLabel>{group.label}</SelectLabel>
              {group.items.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
