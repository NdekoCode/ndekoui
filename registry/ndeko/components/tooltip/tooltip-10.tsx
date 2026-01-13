import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar, AvatarFallback } from '@/registry/ndeko/ui/avatar';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/registry/ndeko/ui/hover-card';

export default function Tooltip10() {
  return (
    <HoverCard>
      <HoverCardTrigger
        href='#'
        aria-label='Lumen Studio profile'
        className={cn('flex rounded-full', FOCUS_RING)}
      >
        <Avatar className='size-10'>
          <AvatarFallback>LS</AvatarFallback>
        </Avatar>
      </HoverCardTrigger>
      <HoverCardContent className='flex w-72 items-start gap-3'>
        <Avatar className='size-10' aria-hidden='true'>
          <AvatarFallback>LS</AvatarFallback>
        </Avatar>
        <div className='flex flex-col gap-1'>
          <p className='text-sm font-medium'>@lumen_studio</p>
          <p className='text-muted-foreground'>
            Interface kits for small teams who ship every week.
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
