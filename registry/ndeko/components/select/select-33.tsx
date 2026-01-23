import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/ndeko/ui/select';

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'bash', label: 'Bash' },
];

export default function Select33() {
  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Code sample</FieldLabel>
      <Select items={LANGUAGES} defaultValue='javascript'>
        <SelectTrigger>
          <span className='flex min-w-0 flex-1 items-center gap-1'>
            <span className='text-muted-foreground shrink-0'>Language:</span>
            <SelectValue placeholder='Pick a language' />
          </span>
        </SelectTrigger>
        <SelectContent>
          {LANGUAGES.map((language) => (
            <SelectItem key={language.value} value={language.value}>
              {language.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
