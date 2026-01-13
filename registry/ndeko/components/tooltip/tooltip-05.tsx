import { GlobeIcon } from '@/registry/ndeko/lib/icons';
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

export default function Tooltip05() {
  return (
    <p className='text-muted-foreground text-[13px]'>
      Workspace data is stored in{' '}
      <HoverCard>
        <HoverCardTrigger href='#' className={LINK}>
          Frankfurt
        </HoverCardTrigger>
        <HoverCardContent className='flex w-72 gap-3 p-3'>
          <GlobeIcon className='text-muted-foreground mt-0.5 size-4 shrink-0' />
          <div className='flex flex-col gap-1'>
            <p className='font-medium'>Data stays in the EU</p>
            <p className='text-muted-foreground text-xs'>
              Files, backups and logs are kept in Frankfurt and never copied
              outside the European Union.
            </p>
          </div>
        </HoverCardContent>
      </HoverCard>
      .
    </p>
  );
}
