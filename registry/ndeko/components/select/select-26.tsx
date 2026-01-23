import { Fragment } from 'react';

import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
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

export default function Select26() {
  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Technology</FieldLabel>
      <Select items={GROUPS} defaultValue='react'>
        <SelectTrigger>
          <SelectValue placeholder='Pick a technology' />
        </SelectTrigger>
        <SelectContent>
          {GROUPS.map((group, index) => (
            <Fragment key={group.label}>
              {index > 0 && <SelectSeparator />}
              <SelectGroup>
                <SelectLabel>{group.label}</SelectLabel>
                {group.items.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </Fragment>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
