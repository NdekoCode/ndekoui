import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/ndeko/ui/select';

const REGIONS = [
  { value: 'us-east', label: 'US East (Virginia)' },
  { value: 'eu-central', label: 'Europe (Frankfurt)' },
  { value: 'af-south', label: 'Africa (Cape Town)' },
  { value: 'ap-southeast', label: 'Asia Pacific (Singapore)' },
];

export default function Select31() {
  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Region</FieldLabel>
      <Select items={REGIONS} defaultValue='eu-central'>
        <SelectTrigger>
          <SelectValue placeholder='Pick a region' />
        </SelectTrigger>
        <SelectContent>
          {REGIONS.map((region) => (
            <SelectItem key={region.value} value={region.value}>
              {region.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
