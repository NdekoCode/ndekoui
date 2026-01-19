import { ArrowRightIcon, SearchIcon } from '@/registry/ndeko/lib/icons';
import { Field, FieldLabel } from '@/registry/ndeko/ui/field';
import { Input } from '@/registry/ndeko/ui/input';

const FIELD_BUTTON =
  'text-muted-foreground hover:bg-foreground/5 hover:text-foreground focus-visible:ring-ring/25 absolute inset-y-0 end-1 my-auto flex size-6 items-center justify-center rounded-md outline-none transition-[color,background-color,box-shadow] focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50';

export default function Input26() {
  return (
    <Field className='w-full max-w-xs'>
      <FieldLabel>Search</FieldLabel>
      <div className='relative'>
        <Input
          className='peer ps-8 pe-8'
          type='search'
          placeholder='Search projects'
        />
        <span className='text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex w-8 items-center justify-center peer-disabled:opacity-50'>
          <SearchIcon className='size-4' />
        </span>
        <button type='submit' className={FIELD_BUTTON} aria-label='Search'>
          <ArrowRightIcon className='size-4' />
        </button>
      </div>
    </Field>
  );
}
