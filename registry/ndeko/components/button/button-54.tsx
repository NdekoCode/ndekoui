import { ChevronRightIcon } from '@/registry/ndeko/lib/icons';
import { Button } from '@/registry/ndeko/ui/button';

export default function Button54() {
  return (
    <Button variant='outline' className='h-auto gap-4 px-5 py-3 text-start'>
      <span className='flex flex-col gap-1'>
        <span>Talent Agency</span>
        <span className='text-muted-foreground font-normal whitespace-break-spaces'>
          Matches for your roster
        </span>
      </span>
      <ChevronRightIcon className='opacity-60 transition-transform group-hover/button:translate-x-0.5' />
    </Button>
  );
}
