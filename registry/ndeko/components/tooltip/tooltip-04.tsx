import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/registry/ndeko/ui/hover-card';

const LINK = cn(
  'text-primary-ink rounded-sm font-medium underline-offset-4 hover:underline',
  FOCUS_RING
);

export default function Tooltip04() {
  return (
    <p className='text-muted-foreground max-w-xs text-[13px]'>
      The Team plan bills{' '}
      <HoverCard>
        <HoverCardTrigger href='#' className={LINK}>
          by build minute
        </HoverCardTrigger>
        <HoverCardContent className='flex flex-col gap-1 p-3'>
          <p className='font-medium'>Build minutes</p>
          <p className='text-muted-foreground text-xs'>
            Each build is billed for the minutes it runs, rounded up to the next
            minute. Time spent in the queue is free.
          </p>
        </HoverCardContent>
      </HoverCard>
      , with the first 400 included every month.
    </p>
  );
}
