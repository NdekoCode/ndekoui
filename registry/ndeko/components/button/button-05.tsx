import { TrashIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

export default function Button05() {
  return (
    <Button variant='destructive'>
      <TrashIcon className='-ms-1 opacity-60' />
      Delete
    </Button>
  );
}
