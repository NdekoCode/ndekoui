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
    date: 'Mar 15, 2024',
    title: 'Project kickoff',
    description: 'Initial team meeting.',
  },
  {
    id: 2,
    date: 'Mar 22, 2024',
    title: 'Design phase',
    description: 'Completed wireframes.',
  },
  {
    id: 3,
    date: 'Apr 5, 2024',
    title: 'Development sprint',
    description: 'Backend development.',
  },
  {
    id: 4,
    date: 'Apr 19, 2024',
    title: 'Testing and deployment',
    description: 'Performance optimization.',
  },
];

const DOT = [
  'border-foreground/15 scale-75 transition-[background-color,border-color,scale] duration-200 ease-out-strong',
  'group-data-completed/timeline-item:border-primary group-data-completed/timeline-item:bg-primary group-data-completed/timeline-item:scale-100 group-data-completed/timeline-item:duration-300',
].join(' ');

export default function Timeline11() {
  return (
    <Timeline defaultValue={3} orientation='horizontal'>
      {ITEMS.map((item) => (
        <TimelineItem key={item.id} step={item.id}>
          <TimelineHeader>
            <TimelineSeparator className='bg-foreground/10' />
            <TimelineDate>{item.date}</TimelineDate>
            <TimelineTitle>{item.title}</TimelineTitle>
            <TimelineIndicator className={DOT} />
          </TimelineHeader>
          <TimelineContent>{item.description}</TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
}
