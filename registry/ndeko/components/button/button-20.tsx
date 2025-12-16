import { PlusIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

export default function Button20() {
  return (
    <Button variant='outline' size='icon' aria-label='Add item'>
      <PlusIcon />
    </Button>
  );
}
