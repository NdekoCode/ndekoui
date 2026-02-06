import {
  GitCompareIcon,
  GitForkIcon,
  GitMergeIcon,
  GitPullRequestIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
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
  icon: Icon;
};

const ITEMS: Event[] = [
  {
    id: 1,
    date: '15 minutes ago',
    title: 'Forked repository',
    description: 'Forked the repository to start a new branch.',
    icon: GitForkIcon,
  },
  {
    id: 2,
    date: '10 minutes ago',
    title: 'Pull request submitted',
    description:
      'Submitted PR #342 with the new feature. Waiting for a code review from the team leads.',
    icon: GitPullRequestIcon,
  },
  {
    id: 3,
    date: '5 minutes ago',
    title: 'Comparing branches',
    description:
      'Received comments on the PR. Minor changes needed in error handling and documentation.',
    icon: GitCompareIcon,
  },
  {
    id: 4,
    title: 'Merged branch',
    description:
      'Merged the feature branch into the main branch. Ready for deployment.',
    icon: GitMergeIcon,
  },
];

const CIRCLE = [
  'bg-foreground/[0.06] text-muted-foreground flex size-6 scale-80 items-center justify-center border-none transition-[background-color,color,scale] duration-200 ease-out-strong',
  'group-data-completed/timeline-item:bg-primary group-data-completed/timeline-item:text-primary-foreground group-data-completed/timeline-item:scale-100 group-data-completed/timeline-item:duration-300',
  'group-data-[orientation=vertical]/timeline:-left-7',
].join(' ');

const LINE =
  'bg-foreground/10 group-data-[orientation=vertical]/timeline:-left-7 group-data-[orientation=vertical]/timeline:h-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=vertical]/timeline:translate-y-6.5';

export default function Timeline06() {
  return (
    <Timeline defaultValue={3}>
      {ITEMS.map((item) => (
        <TimelineItem
          key={item.id}
          step={item.id}
          className='group-data-[orientation=vertical]/timeline:ms-10'
        >
          <TimelineHeader>
            <TimelineSeparator className={LINE} />
            <TimelineTitle className='mt-0.5'>{item.title}</TimelineTitle>
            <TimelineIndicator className={CIRCLE}>
              <item.icon className='size-3.5' />
            </TimelineIndicator>
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
