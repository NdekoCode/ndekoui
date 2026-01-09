import { useId } from 'react';

const INSET_FIELD = [
  'relative w-full max-w-xs rounded-md border border-transparent bg-card shadow-[0_1px_2px_rgb(0_0_0/0.05)] hairline-ring ring-foreground/12',
  'transition-[box-shadow,border-color] duration-150',
  'dark:bg-foreground/[0.04] dark:ring-foreground/15',
  'focus-within:border-foreground/30 focus-within:ring-[3px] focus-within:ring-ring/25 dark:focus-within:border-foreground/25',
  'has-aria-invalid:border-destructive/60 has-aria-invalid:ring-destructive/20 dark:has-aria-invalid:ring-destructive/40',
  'has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:opacity-50',
].join(' ');

const INSET_TEXTAREA = [
  'field-sizing-content block max-h-[12lh] min-h-14 w-full resize-none bg-transparent px-2.5 pb-2 leading-normal outline-none',
  'text-base text-foreground placeholder:text-muted-foreground/75 md:text-[13px]',
  'selection:bg-primary selection:text-primary-foreground',
].join(' ');

export default function Textarea15() {
  const id = useId();

  return (
    <div className={INSET_FIELD}>
      <label
        htmlFor={id}
        className='text-foreground block px-2.5 pt-2 pb-0.5 text-xs font-medium'
      >
        Shipping instructions
      </label>
      <textarea
        id={id}
        className={INSET_TEXTAREA}
        placeholder='Leave it with the front desk'
      />
    </div>
  );
}
