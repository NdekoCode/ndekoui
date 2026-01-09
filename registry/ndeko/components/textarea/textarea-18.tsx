import { useId } from 'react';

import { Label } from '@/registry/ndeko/ui/label';
import { Textarea } from '@/registry/ndeko/ui/textarea';

const READ_ONLY = [
  'read-only:bg-foreground/[0.03] read-only:shadow-none',
  'dark:read-only:bg-foreground/[0.02]',
].join(' ');

export default function Textarea18() {
  const id = useId();

  return (
    <div className='flex w-full max-w-xs flex-col gap-2'>
      <Label htmlFor={id}>Release notes</Label>
      <Textarea
        id={id}
        className={READ_ONLY}
        defaultValue='Version 2.4 adds offline drafts and fixes the sync delay on large projects.'
        readOnly
      />
    </div>
  );
}
