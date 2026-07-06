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

type ScheduleProps = {
  orientation: 'horizontal' | 'vertical';
};

const BOOK_LAUNCH: Stage[] = [
  { day: '2026-09-14', title: 'Final manuscript', note: 'Edits signed off' },
  { day: '2026-10-05', title: 'Proofs', note: 'Two rounds read' },
  { day: '2026-10-26', title: 'Printing', note: 'First run on press' },
  { day: '2026-11-19', title: 'Launch night', note: 'Reading at the shop' },
];

const DONE_COUNT = 3;

const CLOSER_ROWS_WHEN_STACKED =
  'group-data-[orientation=vertical]/timeline:not-last:pb-6';

function Schedule({ orientation }: ScheduleProps) {
  return (
    <Timeline
      defaultValue={DONE_COUNT}
      orientation={orientation}
      role='list'
      aria-label='Solway Books launch schedule'
    >
      {BOOK_LAUNCH.map((stage, index) => {
        const step = index + 1;
        const state = stepStateOf(step, DONE_COUNT);

        return (
          <TimelineItem
            key={stage.day}
            step={step}
            role='listitem'
            aria-current={currentStepOf(state)}
            className={CLOSER_ROWS_WHEN_STACKED}
          >
            <TimelineHeader>
              <TimelineIndicator />
              <TimelineSeparator />
              <TimelineDate dateTime={stage.day}>
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

export default function Timeline11() {
  return (
    <ByWidth
      narrow={<Schedule orientation='vertical' />}
      wide={<Schedule orientation='horizontal' />}
    />
  );
}
