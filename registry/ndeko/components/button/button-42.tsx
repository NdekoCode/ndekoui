import { ChevronRightIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

export default function Button42() {
  return (
    <Button className='pe-11'>
      Next
      <span className='bg-primary-foreground/15 pointer-events-none absolute inset-y-0 end-0 flex w-8 items-center justify-center rounded-e-full'>
        <ChevronRightIcon className='opacity-60' />
      </span>
    </Button>
  );
}
