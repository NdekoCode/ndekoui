import { useId } from 'react';

import { Label } from '@/registry/ndeko/ui/label';
import { Textarea } from '@/registry/ndeko/ui/textarea';

export default function Textarea05() {
  const id = useId();

  return (
    <div className='flex w-full max-w-xs flex-col gap-2'>
      <Label htmlFor={id}>Project brief</Label>
      <Textarea
        id={id}
        placeholder='Describe the goal in a few lines'
        className='focus-visible:border-primary/60 focus-visible:ring-primary/20 dark:focus-visible:border-primary/60 dark:focus-visible:ring-primary/30'
      />
    </div>
  );
}
