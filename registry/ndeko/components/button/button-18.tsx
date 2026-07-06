import { ChevronDownIcon } from '@/registry/ndeko/lib/icons';
import { Avatar } from '@/registry/ndeko/ui/avatar';
import { Button } from '@/registry/ndeko/ui/button';

export default function Button18() {
  return (
    <Button
      variant='ghost'
      className='h-auto p-0 hover:bg-transparent'
      aria-label='Open account menu'
    >
      <Avatar seed='Keith Kennedy' />
      <ChevronDownIcon className='opacity-60' />
    </Button>
  );
}
