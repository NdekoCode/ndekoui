import { ClockIcon } from '@/registry/ndeko/lib/icons';
import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/ndeko/ui/select';

const SHIFTS = [
  { value: 'morning', label: '6:00 AM to 2:00 PM' },
  { value: 'afternoon', label: '2:00 PM to 10:00 PM' },
  { value: 'night', label: '10:00 PM to 6:00 AM' },
];

export default function Select17() {
  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Shift</FieldLabel>
      <Select items={SHIFTS} defaultValue='morning'>
        <SelectTrigger>
          <ClockIcon className='text-muted-foreground' />
          <SelectValue placeholder='Pick a shift' />
        </SelectTrigger>
        <SelectContent>
          {SHIFTS.map((shift) => (
            <SelectItem key={shift.value} value={shift.value}>
              {shift.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
