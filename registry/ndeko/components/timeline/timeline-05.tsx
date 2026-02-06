import { CheckIcon } from '@/registry/ndeko/lib/icons';
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

const CIRCLE = [
  'border-foreground/15 flex size-6 scale-80 items-center justify-center transition-[background-color,border-color,color,scale] duration-200 ease-out-strong',
  'group-data-completed/timeline-item:border-primary group-data-completed/timeline-item:bg-primary group-data-completed/timeline-item:text-primary-foreground group-data-completed/timeline-item:scale-100 group-data-completed/timeline-item:duration-300',
  'group-data-[orientation=vertical]/timeline:-left-7',
].join(' ');

const CHECK = [
  'size-3.5 scale-60 opacity-0 blur-[2px] transition-[opacity,scale,filter] duration-150 ease-out-strong',
  'group-data-completed/timeline-item:scale-100 group-data-completed/timeline-item:opacity-100 group-data-completed/timeline-item:blur-none',
].join(' ');

const LINE =
  'bg-foreground/10 group-data-[orientation=vertical]/timeline:-left-7 group-data-[orientation=vertical]/timeline:h-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=vertical]/timeline:translate-y-6.5';

export default function Timeline05() {
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
            <TimelineDate>{item.date}</TimelineDate>
            <TimelineTitle>{item.title}</TimelineTitle>
            <TimelineIndicator className={CIRCLE}>
              <CheckIcon strokeWidth={2.5} className={CHECK} />
            </TimelineIndicator>
          </TimelineHeader>
          <TimelineContent>{item.description}</TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
}
