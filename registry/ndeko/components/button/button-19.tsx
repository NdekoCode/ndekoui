import { PlusIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

export default function Button19() {
  return (
    <Button variant='outline' className='aspect-square max-sm:p-0'>
      <PlusIcon className='opacity-60 sm:-ms-1' />
      <span className='max-sm:sr-only'>Add item</span>
    </Button>
  );
}
