import { useId } from 'react';

import { Label } from '@/registry/ndeko/ui/label';
import { Textarea } from '@/registry/ndeko/ui/textarea';

const FILLED = [
  'bg-foreground/[0.04] shadow-none ring-transparent',
  'dark:bg-foreground/[0.06] dark:ring-transparent',
  'focus-visible:bg-card dark:focus-visible:bg-foreground/[0.04]',
].join(' ');

export default function Textarea07() {
  const id = useId();

  return (
    <div className='flex w-full max-w-xs flex-col gap-2'>
      <Label htmlFor={id}>Note to self</Label>
      <Textarea id={id} placeholder='Jot something down' className={FILLED} />
    </div>
  );
}
