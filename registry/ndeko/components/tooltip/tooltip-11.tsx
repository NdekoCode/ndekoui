import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import { Avatar, AvatarFallback } from '@/registry/ndeko/ui/avatar';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/registry/ndeko/ui/hover-card';

const MUTUAL_FRIENDS = [
  { name: 'Ada Brooks', initials: 'AB' },
  { name: 'Leo Martin', initials: 'LM' },
  { name: 'Zoe Hart', initials: 'ZH' },
];

function mutualFriendsLabelOf(count: number) {
  if (count === 1) {
    return '1 mutual friend';
  }
  return `${count} mutual friends`;
}

export default function Tooltip11() {
  return (
    <div className='flex items-center gap-3'>
      <Avatar className='size-10' aria-hidden='true'>
        <AvatarFallback>KK</AvatarFallback>
      </Avatar>
      <div className='flex flex-col gap-0.5'>
        <HoverCard>
          <HoverCardTrigger
            href='#'
            className={cn(
              'rounded-sm text-sm font-medium underline-offset-4 hover:underline',
              FOCUS_RING
            )}
          >
            Keith Kennedy
          </HoverCardTrigger>
          <HoverCardContent className='flex flex-col gap-3'>
            <div className='flex items-center gap-3'>
              <Avatar className='size-10' aria-hidden='true'>
                <AvatarFallback>KK</AvatarFallback>
              </Avatar>
              <div className='flex flex-col gap-0.5'>
                <p className='text-sm font-medium'>Keith Kennedy</p>
                <p className='text-muted-foreground text-xs'>@k.kennedy</p>
              </div>
            </div>
            <p className='text-muted-foreground'>
              Designer at{' '}
              <strong className='text-foreground font-medium'>
                Lumen Studio
              </strong>
              . Draws interfaces for teams who ship every week.
            </p>
            <div className='flex items-center gap-2'>
              <div className='flex -space-x-1.5' aria-hidden='true'>
                {MUTUAL_FRIENDS.map((friend) => (
                  <Avatar
                    key={friend.name}
                    className='ring-popover size-5 text-[9px] ring-2'
                  >
                    <AvatarFallback>{friend.initials}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <span className='text-muted-foreground text-xs'>
                {mutualFriendsLabelOf(MUTUAL_FRIENDS.length)}
              </span>
            </div>
          </HoverCardContent>
        </HoverCard>
        <span className='text-muted-foreground text-xs'>@k.kennedy</span>
      </div>
    </div>
  );
}
