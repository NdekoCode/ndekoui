import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/registry/ndeko/ui/avatar';
import {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from '@/registry/ndeko/ui/timeline';

const ITEMS = [
  {
    id: 1,
    date: '15 minutes ago',
    name: 'Hannah Kandell',
    initials: 'HK',
    action: 'opened a new issue',
    description:
      'The date picker from the component library opens behind the dialog.',
    image: '/avatars/avatar-03.svg',
  },
  {
    id: 2,
    date: '10 minutes ago',
    name: 'Chris Tompson',
    initials: 'CT',
    action: 'commented on the issue',
    description:
      'Same here on Safari and Chrome. It looks like the popover sits under the dialog layer.',
    image: '/avatars/avatar-04.svg',
  },
  {
    id: 3,
    date: '5 minutes ago',
    name: 'Emma Davis',
    initials: 'ED',
    action: 'assigned you to the issue',
    description: 'Can you take a look before the Friday release?',
    image: '/avatars/avatar-05.svg',
  },
  {
    id: 4,
    date: '2 minutes ago',
    name: 'Alex Morgan',
    initials: 'AM',
    action: 'closed the issue',
    description: 'Fixed in the latest build. Please review the changes.',
    image: '/avatars/avatar-06.svg',
  },
];

const LINE =
  'bg-foreground/10 group-data-[orientation=vertical]/timeline:-left-7 group-data-[orientation=vertical]/timeline:h-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=vertical]/timeline:translate-y-6.5';

const COMMENT_CARD =
  'bg-card text-foreground hairline-ring ring-border mt-2 rounded-xl px-4 py-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)]';

export default function Timeline07() {
  return (
    <Timeline className='w-full max-w-md'>
      {ITEMS.map((item) => (
        <TimelineItem
          key={item.id}
          step={item.id}
          className='group-data-[orientation=vertical]/timeline:ms-10 group-data-[orientation=vertical]/timeline:not-last:pb-8'
        >
          <TimelineHeader>
            <TimelineSeparator className={LINE} />
            <TimelineTitle className='mt-0.5'>
              {item.name}{' '}
              <span className='text-muted-foreground font-normal'>
                {item.action}
              </span>
            </TimelineTitle>
            <TimelineIndicator className='flex size-6 items-center justify-center border-none bg-transparent group-data-[orientation=vertical]/timeline:-left-7'>
              <Avatar className='size-6 text-[10px]'>
                <AvatarImage src={item.image} alt={item.name} />
                <AvatarFallback>{item.initials}</AvatarFallback>
              </Avatar>
            </TimelineIndicator>
          </TimelineHeader>
          <TimelineContent className={COMMENT_CARD}>
            {item.description}
            <TimelineDate className='mt-1 mb-0'>{item.date}</TimelineDate>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
}
