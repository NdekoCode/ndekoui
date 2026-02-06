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

const DATE_ON_THE_SIDE =
  'group-data-[orientation=vertical]/timeline:@md:absolute group-data-[orientation=vertical]/timeline:@md:-left-32 group-data-[orientation=vertical]/timeline:@md:w-20 group-data-[orientation=vertical]/timeline:@md:text-right';

export default function Timeline02() {
  return (
    <Timeline defaultValue={3} className='@container w-full'>
      {ITEMS.map((item) => (
        <TimelineItem
          key={item.id}
          step={item.id}
          className='group-data-[orientation=vertical]/timeline:@md:ms-32'
        >
          <TimelineHeader>
            <TimelineSeparator className='bg-foreground/10' />
            <TimelineDate className={DATE_ON_THE_SIDE}>
              {item.date}
            </TimelineDate>
            <TimelineTitle className='@md:-mt-0.5'>{item.title}</TimelineTitle>
            <TimelineIndicator className={DOT} />
          </TimelineHeader>
          <TimelineContent>{item.description}</TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
}
