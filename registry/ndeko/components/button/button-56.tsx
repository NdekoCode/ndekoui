import { ArrowUpRightIcon } from '@/registry/ndeko/lib/icons';
import { cn } from '@/registry/ndeko/lib/utils';
import { Button } from '@/registry/ndeko/ui/button';

const TRAVEL = 'transition-[translate] ease-(--ease-out-strong)';

const LEAVING_ARROW =
  'duration-250 group-hover/button:translate-x-5 group-hover/button:-translate-y-5 group-hover/button:duration-200';

const ARRIVING_ARROW =
  'absolute -translate-x-5 translate-y-5 duration-200 group-hover/button:translate-x-0 group-hover/button:translate-y-0 group-hover/button:duration-250';

export default function Button56() {
  return (
    <Button className='pe-1'>
      Read the guide
      <span
        aria-hidden='true'
        className='bg-primary-foreground/15 relative flex size-6 items-center justify-center overflow-hidden rounded-full'
      >
        <ArrowUpRightIcon className={cn(TRAVEL, LEAVING_ARROW)} />
        <ArrowUpRightIcon className={cn(TRAVEL, ARRIVING_ARROW)} />
      </span>
    </Button>
  );
}
