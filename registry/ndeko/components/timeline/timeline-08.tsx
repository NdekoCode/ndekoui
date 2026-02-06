import {
  Timeline,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from '@/registry/ndeko/ui/timeline';

const ITEMS = [
  { id: 1, date: 'Mar 15, 2024', title: 'Project kickoff' },
  { id: 2, date: 'Mar 22, 2024', title: 'Design phase' },
  { id: 3, date: 'Apr 5, 2024', title: 'Development sprint' },
  { id: 4, date: 'Apr 19, 2024', title: 'Testing and deployment' },
  { id: 5, date: 'May 3, 2024', title: 'User training' },
  { id: 6, date: 'May 17, 2024', title: 'Project handover' },
];

const DOT = [
  'border-foreground/15 scale-75 transition-[background-color,border-color,scale] duration-200 ease-out-strong',
  'group-data-completed/timeline-item:border-primary group-data-completed/timeline-item:bg-primary group-data-completed/timeline-item:scale-100 group-data-completed/timeline-item:duration-300',
].join(' ');

const ALTERNATING_ITEM = [
  'w-[calc(50%-1.5rem)] odd:ms-auto even:text-right',
  'even:group-data-[orientation=vertical]/timeline:ms-0 even:group-data-[orientation=vertical]/timeline:me-8',
  'even:group-data-[orientation=vertical]/timeline:[&_[data-slot=timeline-indicator]]:-right-6 even:group-data-[orientation=vertical]/timeline:[&_[data-slot=timeline-indicator]]:left-auto even:group-data-[orientation=vertical]/timeline:[&_[data-slot=timeline-indicator]]:translate-x-1/2',
  'even:group-data-[orientation=vertical]/timeline:[&_[data-slot=timeline-separator]]:-right-6 even:group-data-[orientation=vertical]/timeline:[&_[data-slot=timeline-separator]]:left-auto even:group-data-[orientation=vertical]/timeline:[&_[data-slot=timeline-separator]]:translate-x-1/2',
].join(' ');

export default function Timeline08() {
  return (
    <Timeline defaultValue={3} className='w-full'>
      {ITEMS.map((item) => (
        <TimelineItem key={item.id} step={item.id} className={ALTERNATING_ITEM}>
          <TimelineHeader>
            <TimelineSeparator className='bg-foreground/10' />
            <TimelineDate>{item.date}</TimelineDate>
            <TimelineTitle>{item.title}</TimelineTitle>
            <TimelineIndicator className={DOT} />
          </TimelineHeader>
        </TimelineItem>
      ))}
    </Timeline>
  );
}
