import { ChevronLeftIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

export default function Button50() {
  return (
    <Button variant='link' className='gap-1'>
      <ChevronLeftIcon className='opacity-60' />
      Go back
    </Button>
  );
}
