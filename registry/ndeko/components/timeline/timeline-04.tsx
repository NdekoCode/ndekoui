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

type Event = {
  id: number;
  date?: string;
  title: string;
  description: string;
};

const ITEMS: Event[] = [
  {
    id: 1,
    date: '15 minutes ago',
    title: 'Pull request submitted',
    description:
      'Submitted PR #342 with the new feature. Waiting for a code review from the team leads.',
  },
  {
    id: 2,
    date: '10 minutes ago',
    title: 'CI pipeline started',
    description:
      'Automated tests and build started. Running unit tests and code quality checks.',
  },
  {
    id: 3,
    date: '5 minutes ago',
    title: 'Code review feedback',
    description:
      'Received comments on the PR. Minor changes needed in error handling and documentation.',
  },
  {
    id: 4,
    title: 'Changes pushed',
    description:
      'Implemented the requested changes and pushed them to the feature branch. Awaiting final approval.',
  },
];

const DOT = [
  'border-foreground/15 scale-75 transition-[background-color,border-color,scale] duration-200 ease-out-strong',
  'group-data-completed/timeline-item:border-primary group-data-completed/timeline-item:bg-primary group-data-completed/timeline-item:scale-100 group-data-completed/timeline-item:duration-300',
].join(' ');

export default function Timeline04() {
  return (
    <Timeline defaultValue={3}>
      {ITEMS.map((item) => (
        <TimelineItem key={item.id} step={item.id}>
          <TimelineHeader>
            <TimelineSeparator className='bg-foreground/10' />
            <TimelineTitle className='-mt-0.5'>{item.title}</TimelineTitle>
            <TimelineIndicator className={DOT} />
          </TimelineHeader>
          <TimelineContent>
            {item.description}
            {item.date && (
              <TimelineDate className='mt-2 mb-0'>{item.date}</TimelineDate>
            )}
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
}
