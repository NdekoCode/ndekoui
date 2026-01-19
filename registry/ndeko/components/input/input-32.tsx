import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';

const FLOATING_LABEL = [
  'text-muted-foreground pointer-events-none absolute start-2 top-1/2 z-10 origin-left -translate-y-1/2 rounded-sm px-1 rtl:origin-right',
  'transition-[translate,scale,color,background-color] duration-150 ease-out',
  'group-focus-within:bg-card group-focus-within:text-foreground group-focus-within:-translate-y-[calc(50%_+_18px)] group-focus-within:scale-90',
  'has-[+input:not(:placeholder-shown)]:bg-card has-[+input:not(:placeholder-shown)]:text-foreground has-[+input:not(:placeholder-shown)]:-translate-y-[calc(50%_+_18px)] has-[+input:not(:placeholder-shown)]:scale-90',
].join(' ');

export default function Input32() {
  return (
    <Field className='relative w-full max-w-xs'>
      <FieldLabel className={FLOATING_LABEL}>Email</FieldLabel>
      <Input size='lg' type='email' placeholder=' ' />
    </Field>
  );
}
