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

import { dayLabelOf } from './_parts/dates';
import { currentStepOf, stepStateOf, StepStateNote } from './_parts/step-state';

type Milestone = {
  day: string;
  title: string;
  note: string;
};

const RELEASE: Milestone[] = [
  {
    day: '2026-10-06',
    title: 'Feature freeze',
    note: 'The last changes land on the release branch. From here only fixes go in.',
  },
  {
    day: '2026-10-20',
    title: 'Beta with design partners',
    note: 'A handful of teams run the beta on their own projects and report what breaks.',
  },
  {
    day: '2026-11-03',
    title: 'Release candidate',
    note: 'Docs, changelog and migration notes are frozen with the build.',
  },
  {
    day: '2026-11-17',
    title: 'General availability',
    note: 'The release reaches every workspace over two days, then the old runner is retired.',
  },
];

const DONE_COUNT = 3;

/* From 448px of its own width the piece gives the dates a column: each row moves over and its date hangs to the left of the rail. */
const ROW_BESIDE_ITS_DATE =
  '@md:group-data-[orientation=vertical]/timeline:ms-36';

const DATE_IN_THE_COLUMN =
  '@md:absolute @md:end-full @md:me-12 @md:mb-0 @md:w-24 @md:text-end';

export default function Timeline02() {
  return (
    <Timeline
      defaultValue={DONE_COUNT}
      role='list'
      aria-label='Wrenfield autumn release'
      className='@container w-full'
    >
      {RELEASE.map((milestone, index) => {
        const step = index + 1;
        const state = stepStateOf(step, DONE_COUNT);

        return (
          <TimelineItem
            key={milestone.day}
            step={step}
            role='listitem'
            aria-current={currentStepOf(state)}
            className={ROW_BESIDE_ITS_DATE}
          >
            <TimelineHeader>
              <TimelineIndicator />
              <TimelineSeparator />
              <TimelineDate
                dateTime={milestone.day}
                className={DATE_IN_THE_COLUMN}
              >
                {dayLabelOf(milestone.day)}
              </TimelineDate>
              <TimelineTitle className='@md:-mt-0.5'>
                {milestone.title}
                <StepStateNote state={state} />
              </TimelineTitle>
            </TimelineHeader>
            <TimelineContent>{milestone.note}</TimelineContent>
          </TimelineItem>
        );
      })}
    </Timeline>
  );
}
