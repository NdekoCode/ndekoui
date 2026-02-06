import {
  Timeline,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from '@/registry/ndeko/ui/timeline';

const ITEMS = [
  { id: 1, title: 'Project kickoff' },
  { id: 2, title: 'Design phase' },
  { id: 3, title: 'Development sprint' },
  { id: 4, title: 'Testing and deployment' },
];

const DOT = [
  'border-foreground/15 scale-75 transition-[background-color,border-color,scale] duration-200 ease-out-strong',
  'group-data-completed/timeline-item:border-primary group-data-completed/timeline-item:bg-primary group-data-completed/timeline-item:scale-100 group-data-completed/timeline-item:duration-300',
].join(' ');

export default function Timeline01() {
  return (
    <Timeline defaultValue={3}>
      {ITEMS.map((item) => (
        <TimelineItem key={item.id} step={item.id}>
          <TimelineHeader>
            <TimelineSeparator className='bg-foreground/10' />
            <TimelineTitle className='-mt-0.5'>{item.title}</TimelineTitle>
            <TimelineIndicator className={DOT} />
          </TimelineHeader>
        </TimelineItem>
      ))}
    </Timeline>
  );
}
