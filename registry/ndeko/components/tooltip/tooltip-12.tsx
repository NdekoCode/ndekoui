import { BookOpenIcon } from '@/registry/ndeko/lib/icons';
import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/registry/ndeko/ui/hover-card';

export default function Tooltip12() {
  return (
    <HoverCard>
      <HoverCardTrigger
        href='#'
        aria-label='Building a design system with tokens and hairlines'
        className={cn(
          'bg-foreground/[0.04] hairline-ring ring-border flex size-16 items-center justify-center rounded-lg',
          FOCUS_RING
        )}
      >
        <span className='gem-plate flex size-8 items-center justify-center rounded-lg [--gem:var(--primary)]'>
          <BookOpenIcon className='size-4' />
        </span>
      </HoverCardTrigger>
      <HoverCardContent showArrow className='flex w-72 flex-col gap-3'>
        <div className='flex flex-col gap-1'>
          <p className='text-sm font-medium text-balance'>
            Building a design system with tokens and hairlines
          </p>
          <p className='text-muted-foreground'>
            How to set up colour tokens, one-pixel lines and floating surfaces
            that read the same in light and dark themes.
          </p>
        </div>
        <p className='text-muted-foreground flex items-center gap-2 text-xs'>
          <span>8 min read</span>
          <span aria-hidden='true'>·</span>
          <span>Updated 2 days ago</span>
        </p>
      </HoverCardContent>
    </HoverCard>
  );
}
