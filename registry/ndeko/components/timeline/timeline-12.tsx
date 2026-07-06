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

import { ByWidth } from './_parts/by-width';
import { dayLabelOf } from './_parts/dates';
import { currentStepOf, stepStateOf, StepStateNote } from './_parts/step-state';

type Stage = {
  day: string;
  title: string;
  note: string;
};

type OpeningPlanProps = {
  orientation: 'horizontal' | 'vertical';
};

const CLINIC_OPENING: Stage[] = [
  {
    day: '2026-08-31',
    title: 'Lease signed',
    note: 'Ground floor, Mill Street',
  },
  { day: '2026-09-28', title: 'Fit-out', note: 'Six rooms and a small lab' },
  { day: '2026-10-26', title: 'Team trained', note: 'Front desk and nurses' },
  { day: '2026-11-23', title: 'First patients', note: 'Booking opens online' },
];

const DONE_COUNT = 3;

/* Along the line the date takes the first row: the rail and its dots run under it, and the title starts under the rail. */
const ROW = [
  'group-data-[orientation=horizontal]/timeline:mt-0',
  'group-data-[orientation=vertical]/timeline:not-last:pb-6',
].join(' ');

const UNDER_THE_DATE = 'group-data-[orientation=horizontal]/timeline:top-8';

const DATE_ABOVE_THE_RAIL =
  'group-data-[orientation=horizontal]/timeline:mb-10';

function OpeningPlan({ orientation }: OpeningPlanProps) {
  return (
    <Timeline
      defaultValue={DONE_COUNT}
      orientation={orientation}
      role='list'
      aria-label='Juniper Health clinic opening'
    >
      {CLINIC_OPENING.map((stage, index) => {
        const step = index + 1;
        const state = stepStateOf(step, DONE_COUNT);

        return (
          <TimelineItem
            key={stage.day}
            step={step}
            role='listitem'
            aria-current={currentStepOf(state)}
            className={ROW}
          >
            <TimelineHeader>
              <TimelineIndicator className={UNDER_THE_DATE} />
              <TimelineSeparator className={UNDER_THE_DATE} />
              <TimelineDate
                dateTime={stage.day}
                className={DATE_ABOVE_THE_RAIL}
              >
                {dayLabelOf(stage.day)}
              </TimelineDate>
              <TimelineTitle>
                {stage.title}
                <StepStateNote state={state} />
              </TimelineTitle>
            </TimelineHeader>
            <TimelineContent>{stage.note}</TimelineContent>
          </TimelineItem>
        );
      })}
    </Timeline>
  );
}

export default function Timeline12() {
  return (
    <ByWidth
      narrow={<OpeningPlan orientation='vertical' />}
      wide={<OpeningPlan orientation='horizontal' />}
    />
  );
}
