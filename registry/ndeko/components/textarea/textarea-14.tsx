import { useId } from 'react';

import { Textarea } from '@/registry/ndeko/ui/textarea';

const FLOATING_LABEL = [
  'pointer-events-none absolute start-1.5 top-0 z-10 origin-left px-1 text-[13px] leading-5 text-muted-foreground',
  'translate-y-2 transition-[translate,scale,color] duration-150 ease-(--ease-standard)',
  'group-focus-within:-translate-y-1/2 group-focus-within:scale-[0.85] group-focus-within:bg-card group-focus-within:text-foreground',
  'has-[+textarea:not(:placeholder-shown)]:-translate-y-1/2 has-[+textarea:not(:placeholder-shown)]:scale-[0.85]',
  'has-[+textarea:not(:placeholder-shown)]:bg-card has-[+textarea:not(:placeholder-shown)]:text-foreground',
].join(' ');

export default function Textarea14() {
  const id = useId();

  return (
    <div className='group relative w-full max-w-xs'>
      <label htmlFor={id} className={FLOATING_LABEL}>
        Describe the issue
      </label>
      <Textarea id={id} placeholder=' ' />
    </div>
  );
}
