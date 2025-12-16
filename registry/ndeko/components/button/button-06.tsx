import { XIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

export default function Button06() {
  return (
    <Button variant='secondary'>
      <XIcon className='-ms-1 opacity-60' />
      Dismiss
    </Button>
  );
}
