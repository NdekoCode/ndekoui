import {
  BoxIcon,
  HomeIcon,
  ReceiptIcon,
  RouteIcon,
  type Icon,
} from '@/registry/ndeko/lib/icons';
import {
  Timeline,
  TimelineContent,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from '@/registry/ndeko/ui/timeline';

import { AgoTime } from './_parts/ago-time';
import { MARKER, MARKER_RAIL, MARKER_ROW } from './_parts/markers';
import { currentStepOf, stepStateOf, StepStateNote } from './_parts/step-state';

type OrderEvent = {
  title: string;
  detail: string;
  icon: Icon;
  at?: string;
};

const ORDER: OrderEvent[] = [
  {
    title: 'Order placed',
    detail:
      'Order OF-20931: two bags of oat granola and a tin of cocoa, 31.50 EUR.',
    icon: ReceiptIcon,
    at: '2026-11-11T13:00:00',
  },
  {
    title: 'Packed',
    detail: 'Packed in the Oatfield kitchen and sealed in a paper box.',
    icon: BoxIcon,
    at: '2026-11-11T19:00:00',
  },
  {
    title: 'Out for delivery',
    detail: 'On the van since this afternoon, eleven stops before yours.',
    icon: RouteIcon,
    at: '2026-11-12T14:10:00',
  },
  {
    title: 'Delivered',
    detail:
      'Expected today between 15:30 and 17:30, left with a neighbour if nobody is in.',
    icon: HomeIcon,
  },
];

const DONE_COUNT = 3;

const ICON_TILE = [
  MARKER,
  'bg-foreground/[0.06] text-muted-foreground scale-90 border-none',
  'group-data-completed/timeline-item:bg-primary group-data-completed/timeline-item:text-primary-foreground group-data-completed/timeline-item:scale-100',
].join(' ');

export default function Timeline06() {
  return (
    <Timeline
      defaultValue={DONE_COUNT}
      role='list'
      aria-label='Oatfield order OF-20931'
      className='[--marker:1.5rem]'
    >
      {ORDER.map((orderEvent, index) => {
        const step = index + 1;
        const state = stepStateOf(step, DONE_COUNT);

        return (
          <TimelineItem
            key={orderEvent.title}
            step={step}
            role='listitem'
            aria-current={currentStepOf(state)}
            className={MARKER_ROW}
          >
            <TimelineHeader>
              <TimelineIndicator className={ICON_TILE}>
                <orderEvent.icon className='size-3.5' />
              </TimelineIndicator>
              <TimelineSeparator className={MARKER_RAIL} />
              <TimelineTitle className='mt-0.5'>
                {orderEvent.title}
                <StepStateNote state={state} />
              </TimelineTitle>
            </TimelineHeader>
            <TimelineContent>
              {orderEvent.detail}
              {orderEvent.at && <AgoTime at={orderEvent.at} className='mt-2' />}
            </TimelineContent>
          </TimelineItem>
        );
      })}
    </Timeline>
  );
}
