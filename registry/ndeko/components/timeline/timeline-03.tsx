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
    description:
      'Initial team meeting and project scope definition. Established key milestones and resource allocation.',
  },
  {
    id: 2,
    date: 'Mar 22, 2024',
    title: 'Design phase',
    description:
      'Completed wireframes and user interface mockups. Stakeholder review and feedback incorporated.',
  },
  {
    id: 3,
    date: 'Apr 5, 2024',
    title: 'Development sprint',
    description:
      'Backend API implementation and frontend component development in progress.',
  },
  {
    id: 4,
    date: 'Apr 19, 2024',
    title: 'Testing and deployment',
    description:
      'Quality assurance testing, performance optimization and production deployment preparation.',
  },
];

const DOT = [
  'border-foreground/15 scale-75 transition-[background-color,border-color,scale] duration-200 ease-out-strong',
  'group-data-completed/timeline-item:border-primary group-data-completed/timeline-item:bg-primary group-data-completed/timeline-item:scale-100 group-data-completed/timeline-item:duration-300',
].join(' ');

export default function Timeline03() {
  return (
    <Timeline defaultValue={3}>
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
