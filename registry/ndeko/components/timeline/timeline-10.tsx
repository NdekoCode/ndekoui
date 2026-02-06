import {
  BookOpenIcon,
  MessageCircleIcon,
  PencilIcon,
  PlusIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import { FOCUS_RING } from '@/registry/ndeko/lib/recipes';
import { cn } from '@/registry/ndeko/lib/utils';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/registry/ndeko/ui/avatar';
import {
  Timeline,
  TimelineContent,
  TimelineItem,
} from '@/registry/ndeko/ui/timeline';

type ActionType = 'post' | 'reply' | 'edit' | 'create';

type Activity = {
  id: number;
  user: string;
  initials: string;
  image: string;
  action: ActionType;
  secondsAgo: number;
};

const ACTIONS: Record<ActionType, { icon: Icon; text: string }> = {
  post: { icon: BookOpenIcon, text: 'wrote a new post' },
  reply: { icon: MessageCircleIcon, text: 'replied to a comment' },
  edit: { icon: PencilIcon, text: 'edited a post' },
  create: { icon: PlusIcon, text: 'created a new project' },
};

const ITEMS: Activity[] = [
  {
    id: 1,
    user: 'Matt',
    initials: 'M',
    image: '/avatars/avatar-04.svg',
    action: 'post',
    secondsAgo: 59,
  },
  {
    id: 2,
    user: 'Matt',
    initials: 'M',
    image: '/avatars/avatar-04.svg',
    action: 'reply',
    secondsAgo: 180,
  },
  {
    id: 3,
    user: 'Matt',
    initials: 'M',
    image: '/avatars/avatar-04.svg',
    action: 'edit',
    secondsAgo: 300,
  },
  {
    id: 4,
    user: 'Matt',
    initials: 'M',
    image: '/avatars/avatar-04.svg',
    action: 'create',
    secondsAgo: 600,
  },
];

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_DAY = 86400;

const LINK = cn('rounded-sm hover:underline', FOCUS_RING);

function countOf(value: number, unit: string) {
  if (value === 1) {
    return `1 ${unit} ago`;
  }
  return `${value} ${unit}s ago`;
}

function relativeTimeOf(secondsAgo: number) {
  if (secondsAgo < SECONDS_PER_MINUTE) {
    return countOf(secondsAgo, 'second');
  }
  if (secondsAgo < SECONDS_PER_HOUR) {
    const minutes = Math.floor(secondsAgo / SECONDS_PER_MINUTE);
    return countOf(minutes, 'minute');
  }
  if (secondsAgo < SECONDS_PER_DAY) {
    const hours = Math.floor(secondsAgo / SECONDS_PER_HOUR);
    return countOf(hours, 'hour');
  }
  const days = Math.floor(secondsAgo / SECONDS_PER_DAY);
  return countOf(days, 'day');
}

export default function Timeline10() {
  return (
    <div className='flex w-full flex-col gap-3'>
      <div className='text-muted-foreground text-xs font-medium'>Activity</div>
      <Timeline>
        {ITEMS.map((item) => {
          const action = ACTIONS[item.action];
          return (
            <TimelineItem
              key={item.id}
              step={item.id}
              className='m-0! flex-row items-center gap-3 py-2.5!'
            >
              <action.icon className='text-muted-foreground size-4' />
              <Avatar className='size-6 text-[10px]'>
                <AvatarImage src={item.image} alt={item.user} />
                <AvatarFallback>{item.initials}</AvatarFallback>
              </Avatar>
              <TimelineContent className='text-foreground'>
                <a href='#' className={cn(LINK, 'font-medium')}>
                  {item.user}
                </a>{' '}
                {action.text}{' '}
                <a href='#' className={cn(LINK, 'text-muted-foreground')}>
                  {relativeTimeOf(item.secondsAgo)}
                </a>
              </TimelineContent>
            </TimelineItem>
          );
        })}
      </Timeline>
    </div>
  );
}
