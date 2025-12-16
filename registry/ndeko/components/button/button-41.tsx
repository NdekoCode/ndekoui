import { ChevronLeftIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

export default function Button41() {
  return (
    <Button className='ps-11'>
      Previous
      <span className='bg-primary-foreground/15 pointer-events-none absolute inset-y-0 start-0 flex w-8 items-center justify-center rounded-s-full'>
        <ChevronLeftIcon className='opacity-60' />
      </span>
    </Button>
  );
}
