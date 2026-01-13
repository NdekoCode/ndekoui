import { LayersIcon } from '@/registry/ndeko/lib/icons';
import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/registry/ndeko/ui/hover-card';

const LINK = cn(
  'text-primary-ink rounded-sm text-[13px] font-medium underline-offset-4 hover:underline',
  FOCUS_RING
);

export default function Tooltip06() {
  return (
    <HoverCard>
      <HoverCardTrigger href='#' className={LINK}>
        What&apos;s new in 2.4
      </HoverCardTrigger>
      <HoverCardContent className='flex w-72 flex-col gap-3 p-3'>
        <div
          className='bg-foreground/[0.04] flex aspect-video items-center justify-center rounded-lg'
          aria-hidden='true'
        >
          <span className='gem-plate flex size-10 items-center justify-center rounded-xl [--gem:var(--primary)]'>
            <LayersIcon className='size-5' />
          </span>
        </div>
        <div className='flex flex-col gap-1'>
          <p className='font-medium'>Saved views</p>
          <p className='text-muted-foreground text-xs'>
            Keep any mix of filters and sorting as a view, then share it with
            your team in one link.
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
