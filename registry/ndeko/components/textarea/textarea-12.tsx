import { useId } from 'react';

import { Button } from '@/registry/ndeko/ui/button';
import { Label } from '@/registry/ndeko/ui/label';
import { Textarea } from '@/registry/ndeko/ui/textarea';

export default function Textarea12() {
  const id = useId();

  return (
    <div className='flex w-full max-w-xs flex-col gap-2'>
      <Label htmlFor={id}>Comment</Label>
      <Textarea id={id} placeholder='Leave a comment' />
      <Button variant='outline' className='w-full'>
        Send comment
      </Button>
    </div>
  );
}
