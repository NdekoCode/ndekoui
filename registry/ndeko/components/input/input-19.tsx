import { SendIcon } from '@/registry/ndeko/lib/icons';
import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';

const FIELD_BUTTON =
  'text-muted-foreground hover:bg-foreground/5 hover:text-foreground focus-visible:ring-ring/25 absolute inset-y-0 end-1 my-auto flex size-6 items-center justify-center rounded-md outline-none transition-[color,background-color,box-shadow] focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50';

export default function Input19() {
  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Newsletter</FieldLabel>
      <div className='relative'>
        <Input className='pe-8' type='email' placeholder='you@example.com' />
        <button type='submit' className={FIELD_BUTTON} aria-label='Subscribe'>
          <SendIcon className='size-4' />
        </button>
      </div>
    </Field>
  );
}
