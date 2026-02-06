import {
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineItem,
} from '@/registry/ndeko/ui/timeline';

const ITEMS = [
  {
    id: 1,
    date: new Date('2024-01-09T10:55:00'),
    description: 'System backup completed.',
  },
  {
    id: 2,
    date: new Date('2024-01-09T10:50:00'),
    description:
      'User authentication service restarted after a configuration update.',
  },
  {
    id: 3,
    date: new Date('2024-01-09T10:45:00'),
    description: 'High CPU usage detected on worker node-03.',
  },
  {
    id: 4,
    date: new Date('2024-01-09T10:40:00'),
    description: 'New deployment started for api-service v2.1.0.',
  },
];

const DAY_FORMAT = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const TIME_FORMAT = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

function timestampOf(date: Date) {
  const day = DAY_FORMAT.format(date);
  const time = TIME_FORMAT.format(date);
  return `${day} at ${time}`;
}

export default function Timeline09() {
  return (
    <Timeline className='bg-card hairline-ring ring-border w-full max-w-md rounded-xl py-1 shadow-[0_1px_2px_rgb(0_0_0/0.04)]'>
      {ITEMS.map((item) => (
        <TimelineItem
          key={item.id}
          step={item.id}
          className='m-0! px-4! py-2.5!'
        >
          <TimelineContent className='text-foreground'>
            {item.description}
            <TimelineDate className='mt-1 mb-0'>
              {timestampOf(item.date)}
            </TimelineDate>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
}
