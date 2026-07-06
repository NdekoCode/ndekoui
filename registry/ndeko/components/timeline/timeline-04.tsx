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
import { currentStepOf, stepStateOf, StepStateNote } from './_parts/step-state';

type ReviewStep = {
  title: string;
  detail: string;
  at?: string;
};

const REVIEW: ReviewStep[] = [
  {
    title: 'Pull request opened',
    detail: 'Mira opened #418, which keeps cart totals in whole cents.',
    at: '2026-11-12T14:18:00',
  },
  {
    title: 'Checks finished',
    detail: 'Type check, lint and 212 tests ran on the first push.',
    at: '2026-11-12T14:25:00',
  },
  {
    title: 'Changes requested',
    detail: 'Idris asked for a rounding test on carts that mix two currencies.',
    at: '2026-11-12T14:42:00',
  },
  {
    title: 'Fix pushed',
    detail:
      'One commit adds the rounding test. The pull request waits for a second look.',
  },
];

const DONE_COUNT = 3;

export default function Timeline04() {
  return (
    <Timeline
      defaultValue={DONE_COUNT}
      role='list'
      aria-label='Review of pull request 418'
    >
      {REVIEW.map((reviewStep, index) => {
        const step = index + 1;
        const state = stepStateOf(step, DONE_COUNT);

        return (
          <TimelineItem
            key={reviewStep.title}
            step={step}
            role='listitem'
            aria-current={currentStepOf(state)}
          >
            <TimelineHeader>
              <TimelineIndicator />
              <TimelineSeparator />
              <TimelineTitle className='-mt-0.5'>
                {reviewStep.title}
                <StepStateNote state={state} />
              </TimelineTitle>
            </TimelineHeader>
            <TimelineContent>
              {reviewStep.detail}
              {reviewStep.at && <AgoTime at={reviewStep.at} className='mt-2' />}
            </TimelineContent>
          </TimelineItem>
        );
      })}
    </Timeline>
  );
}
